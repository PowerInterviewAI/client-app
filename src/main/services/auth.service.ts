import { AuthApi } from '../api/auth.js';
import { configStore } from '../store/config.store.js';
import { accountService } from './account.service.js';
import { appStateService } from './app-state.service.js';
import { toolsService } from './tools.service.js';
import { disableStealth } from './window-control.service.js';

/**
 * AuthService
 * Wrapper around the low-level `AuthApi` client that provides
 * higher-level methods used by the application (login, signup,
 * logout, changePassword). Each method returns a simple result
 * object with `success` and optional `error` message to keep
 * caller-side handling straightforward.
 */
export class AuthService {
  // low-level API client used to perform network requests
  private client = new AuthApi();

  /**
   * Send an email verification code to a prospective user.
   *
   * The backend answers the same whether or not the address already has an account, so a
   * `true` here means "the request went through", never "this address is free". It mails a
   * code to a free address and a "you already have an account" notice to a taken one.
   * Reporting anything more specific to the renderer would put back over the UI the
   * enumeration the endpoint was changed to remove.
   */
  async sendVerificationCode(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.sendVerificationCode({ email });
      if (response.error) {
        return {
          success: false,
          error: response.error.message || 'Failed to send verification code',
        };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to send verification code' };
    }
  }

  /**
   * Verify an email verification code.
   */
  async verifyEmailCode(
    email: string,
    code: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.verifyEmailCode({ email, code });
      if (response.error) {
        return {
          success: false,
          error: response.error.message || 'Invalid or expired verification code',
        };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Invalid or expired verification code' };
    }
  }

  /**
   * Create a new account. Returns a simple success/error result.
   */
  async signup(
    username: string,
    email: string,
    password: string,
    verificationCode: string
  ): Promise<{ success: boolean; error?: string }> {
    if (email && password) {
      try {
        const response = await this.client.signup({
          username,
          email,
          password,
          verification_code: verificationCode,
        });
        if (response.error) {
          return { success: false, error: response.error.message || 'Signup failed' };
        }
        return { success: true };
      } catch {
        return { success: false, error: 'Signup failed' };
      }
    } else {
      return { success: false, error: 'Invalid email or password' };
    }
  }

  /**
   * Attempt to log a user in with `email` and `password`.
   * On success, updates `configStore` with credentials and session token
   * if rememberMe is enabled.
   */
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (email && password) {
      try {
        const response = await this.client.login({ email, password });
        if (response.error) {
          return { success: false, error: response.error.message || 'Login failed' };
        }

        // persist credentials in the config store only if rememberMe is enabled
        const config = configStore.getConfig();
        if (config.rememberMe) {
          configStore.updateConfig({ email, password });
        } else {
          configStore.updateConfig({ email: '', password: '' });
        }
        configStore.updateConfig({ sessionToken: response.data?.session_token });

        // update app state to logged in
        appStateService.updateState({ isLoggedIn: true });

        // pull this account's synced config (full name, profile, context) from the backend.
        // Cleared first so a failed pull leaves the config unloaded rather than whatever
        // the previously signed-in account left behind.
        //
        // Left unawaited for the same reason HealthCheckService.start() does not await it: the
        // request carries a full CV and runs to a 30s timeout, and awaiting it here would hold
        // the login button on a spinner that long whenever the socket stalls. Nothing needs the
        // config to be loaded before the main screen appears - Start gates on
        // `interviewConfigLoaded` and retries the pull itself, and the dialog refreshes on open.
        accountService.clearState();
        void accountService.pullFromBackend();

        return { success: true };
      } catch {
        return { success: false, error: 'Login failed' };
      }
    } else {
      return { success: false, error: 'Invalid email or password' };
    }
  }

  /**
   * Log the current user out.
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.logout();
      if (response.error) {
        return { success: false, error: response.error.message || 'Logout failed' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Logout failed' };
    } finally {
      disableStealth();
      // clear session token and update app state
      configStore.updateConfig({ sessionToken: '' });
      appStateService.updateState({ isLoggedIn: false });
      accountService.clearState();

      // The interview goes with the session it belonged to. The transcript, the suggestions and
      // the mock session all live in main-process memory and nothing else dropped them here, so
      // on a shared machine the next user to sign in inherited the previous one's: the close
      // guard reads `hasHistory` / `hasMockContent` off exactly this state, and would offer to
      // export somebody else's interview to them. Never allowed to fail the sign-out itself -
      // the session is over either way, and a stuck signed-in app is the worse outcome.
      try {
        await toolsService.clearAll({ includeActiveMockSession: true });
        await toolsService.setPlaceholderData();
      } catch (e) {
        console.warn('Failed to clear interview state on sign-out:', e);
      }

      // clear credentials if remember me is not checked
      const config = configStore.getConfig();
      if (!config.rememberMe) {
        configStore.updateConfig({ email: '', password: '' });
      }
    }
  }

  /**
   * Change the authenticated user's password.
   * The API expects `current_password` and `new_password` keys.
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (response.error) {
        return { success: false, error: response.error.message || 'Change password failed' };
      }

      // Only persist when the user opted in - login/logout leave the store empty otherwise,
      // and writing here would put credentials back behind their back.
      //
      // Guarded separately from the request, because by this line the password has already
      // changed on the server. Letting a disk write decide the return value reports a failure
      // for a change that happened, and the dialog then asks the user to try again with a
      // current password that is no longer current, so the retry cannot work either. Same
      // line `resetPassword` draws, and `login.tsx` before it.
      try {
        if (configStore.getConfig().rememberMe) {
          configStore.updateConfig({ password: newPassword });
        }
      } catch (err) {
        console.error('Failed to store the new password after change:', err);
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Change password failed' };
    }
  }

  /**
   * Request a password reset code for an address.
   *
   * The backend answers the same whether or not that address has an account, so a `true`
   * here means "the request went through", never "this address is registered". Reporting
   * anything more specific to the renderer would put back over the UI the enumeration the
   * endpoint exists to avoid.
   */
  async forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.forgotPassword({ email });
      if (response.error) {
        return {
          success: false,
          error: response.error.message || 'Failed to send password reset code',
        };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to send password reset code' };
    }
  }

  /**
   * Check a password reset code without spending it.
   */
  async verifyPasswordResetCode(
    email: string,
    code: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.verifyPasswordResetCode({ email, code });
      if (response.error) {
        return {
          success: false,
          error: response.error.message || 'Invalid or expired reset code',
        };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Invalid or expired reset code' };
    }
  }

  /**
   * Set a new password from a reset code.
   */
  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.resetPassword({
        email,
        code,
        new_password: newPassword,
      });
      if (response.error) {
        return { success: false, error: response.error.message || 'Password reset failed' };
      }

      // The login form pre-fills from the store when rememberMe is on, and if what it holds
      // is this account then the password in it is the one that just stopped working.
      //
      // Two guards, not one. `rememberMe` is the same check changePassword makes: login and
      // logout leave the store empty when the user did not opt in, and writing here would put
      // credentials back on disk behind their back. The address check is specific to reset,
      // which is the only password flow that runs while signed out and can therefore be run
      // for an account other than the remembered one. On a shared machine that would
      // otherwise replace someone else's remembered login with this one.
      //
      // Guarded separately from the request, because by this line the reset has already
      // happened and the code is spent. Letting a disk write decide the return value reports
      // a failure for a reset that succeeded, and the retry that invites cannot work - the
      // same trap the login form avoids when it persists remember-me.
      try {
        const config = configStore.getConfig();
        const isRememberedAccount =
          (config.email ?? '').trim().toLowerCase() === email.trim().toLowerCase();
        if (config.rememberMe && isRememberedAccount) {
          configStore.updateConfig({ password: newPassword });
        }
      } catch (err) {
        console.error('Failed to store the new password after reset:', err);
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Password reset failed' };
    }
  }
}

export const authService = new AuthService();
