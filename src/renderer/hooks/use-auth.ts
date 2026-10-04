import { useState } from 'react';

import { useT } from '@/i18n';

/**
 * useAuth
 * React hook that exposes authentication actions and simple
 * state for `loading` and `error` to drive UI feedback.
 *
 * Methods call into the preload `window.electronAPI.auth` bridge
 * and surface errors by setting `error` and re-throwing so callers
 * can respond as needed.
 */
export default function useAuth() {
  // Only reached when the backend sent no message of its own. Anything it did send is passed
  // through untranslated, because the client cannot translate a string it did not write.
  const t = useT();

  // indicates an in-progress auth request (used to disable UI, show spinners)
  const [loading, setLoading] = useState(false);
  // last auth error message or null
  const [error, setError] = useState<string | null>(null);

  // Send an email verification code. Returns boolean for convenience and
  // sets `error` on failure so callers can surface messages.
  const sendVerificationCode = async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI?.auth.sendVerificationCode(email);
      if (!result?.success) {
        const errMsg = result?.error || t.auth.errors.sendCodeFailed;
        setError(errMsg);
        return false;
      }
      return true;
    } catch (err) {
      console.error('sendVerificationCode error:', err);
      setError(t.auth.errors.sendCodeFailed);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Verify an email verification code. Returns boolean for convenience and
  // sets `error` on failure so callers can surface messages.
  const verifyEmailCode = async (email: string, code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI?.auth.verifyEmailCode(email, code);
      if (!result?.success) {
        const errMsg = result?.error || t.auth.errors.invalidCode;
        setError(errMsg);
        return false;
      }
      return true;
    } catch (err) {
      console.error('verifyEmailCode error:', err);
      setError(t.auth.errors.invalidCode);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Attempt to login; on failure sets `error` and throws.
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await window.electronAPI?.auth.login(email, password);

      if (!result?.success) {
        const errMsg = result?.error || t.auth.errors.loginFailed;
        setError(errMsg);
        throw new Error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign up a new user. Returns boolean for convenience and still
  // sets `error`/throws on failure so callers can surface messages.
  const signup = async (
    username: string,
    email: string,
    password: string,
    verificationCode: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI?.auth.signup(
        username,
        email,
        password,
        verificationCode
      );
      if (!result?.success) {
        const errMsg = result?.error || t.auth.errors.signupFailed;
        setError(errMsg);
        return false;
      }
      return true;
    } catch (err) {
      console.error('signup error:', err);
      setError(t.auth.errors.signupFailed);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Log the current user out; sets `error`/throws on failure.
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await window.electronAPI?.auth.logout();
      if (!result?.success) {
        const errMsg = result?.error || t.auth.errors.logoutFailed;
        setError(errMsg);
        throw new Error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Change the authenticated user's password via the bridge API.
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI?.auth.changePassword(currentPassword, newPassword);
      if (!result?.success) {
        const errMsg = result?.error || t.auth.errors.changePasswordFailed;
        setError(errMsg);
        return false;
      }
      return true;
    } catch (err) {
      console.error('changePassword error:', err);
      setError(t.auth.errors.changePasswordFailed);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Request a password reset code. A `true` result means the request went through,
  // not that the address is registered - the backend answers the same either way so that
  // the endpoint cannot be used to test who has an account, and the UI must not undo that
  // by reporting "no such account" here.
  const forgotPassword = async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI?.auth.forgotPassword(email);
      if (!result?.success) {
        const errMsg = result?.error || t.auth.errors.sendResetCodeFailed;
        setError(errMsg);
        return false;
      }
      return true;
    } catch (err) {
      console.error('forgotPassword error:', err);
      setError(t.auth.errors.sendResetCodeFailed);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check a password reset code without spending it, so a mistyped one is caught before
  // the user has typed a new password twice.
  const verifyPasswordResetCode = async (email: string, code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI?.auth.verifyPasswordResetCode(email, code);
      if (!result?.success) {
        const errMsg = result?.error || t.auth.errors.invalidResetCode;
        setError(errMsg);
        return false;
      }
      return true;
    } catch (err) {
      console.error('verifyPasswordResetCode error:', err);
      setError(t.auth.errors.invalidResetCode);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Set a new password from a reset code.
  const resetPassword = async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI?.auth.resetPassword(email, code, newPassword);
      if (!result?.success) {
        const errMsg = result?.error || t.auth.errors.resetFailed;
        setError(errMsg);
        return false;
      }
      return true;
    } catch (err) {
      console.error('resetPassword error:', err);
      setError(t.auth.errors.resetFailed);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Return stable object for consumers; `setError` is exposed so callers
  // can clear errors when appropriate (e.g. on input changes).
  return {
    sendVerificationCode,
    verifyEmailCode,
    login,
    signup,
    logout,
    changePassword,
    forgotPassword,
    verifyPasswordResetCode,
    resetPassword,
    loading,
    error,
    setError,
  } as const;
}
