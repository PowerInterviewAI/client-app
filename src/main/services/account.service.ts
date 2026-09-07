import { UsersApi } from '../api/users.js';
import {
  claimLegacyInterviewConf,
  clearLegacyInterviewConf,
  getLegacyInterviewConf,
  getLegacyInterviewConfOwner,
} from '../store/config.store.js';
import { UserAccount } from '../types/account.js';
import { InterviewConfig } from '../types/app-state.js';
import { appStateService } from './app-state.service.js';

/**
 * AccountService
 * Keeps the in-memory interview config (full name, profile, context) in sync with
 * the account persisted on the backend. Not written to local disk - the backend is
 * the only durable store, so this always reflects whatever was last fetched/saved
 * this session.
 */
export class AccountService {
  private client = new UsersApi();

  /** Bumped by every write to the config in app state. See `applyIfCurrent`. */
  private generation = 0;

  /**
   * Write a config read into app state, unless something newer landed while it was in flight.
   *
   * The startup pull is deliberately unawaited and can take up to the 30s request timeout, so a
   * save from the dialog, a logout, or a second pull can all land first. Applying the older read
   * afterwards shows nothing: the dialog is closed by then, and the suggestion services read the
   * config straight out of app state, so the rest of the session would run on the stale CV.
   *
   * Writes the caller already knows to be authoritative (`updateConfig`, `clearState`) bump the
   * generation directly instead of going through here.
   */
  private applyIfCurrent(generation: number, config: InterviewConfig, loaded: boolean): boolean {
    if (generation !== this.generation) return false;

    this.generation++;
    appStateService.updateState({ interviewConfig: config, interviewConfigLoaded: loaded });
    return true;
  }

  /**
   * Whether this account has been through the client's first-run setup, as the account reports it.
   *
   * **Absent counts as done.** A backend that predates the field omits it, and reading that as
   * "not done" would put every user of that deployment into the wizard - with no way out, since
   * the only exits from it write through an endpoint that deployment does not have either.
   * Guessing wrong in this direction costs a screen nobody saw; wrong in the other direction
   * locks the app.
   */
  private static readsAsOnboarded(account: UserAccount): boolean {
    return account.onboarding_completed !== false;
  }

  /**
   * Pull the authenticated user's persisted interview config from the backend
   * into app state. Called after login so a device shows the same config the
   * user last saved anywhere.
   */
  async pullFromBackend(): Promise<{ success: boolean; error?: string }> {
    const generation = this.generation;
    try {
      const response = await this.client.getMe();
      if (response.error || !response.data) {
        return { success: false, error: response.error?.message || 'Failed to fetch account' };
      }

      const account = response.data;
      const interviewConfig = account.interview_config;

      // Applied here rather than alongside the config below, because the migration branch that
      // follows returns early and the flag has nothing to do with what it is migrating. Guarded
      // but not bumping: this is one field off a read, not a write that supersedes anything.
      if (generation === this.generation) {
        appStateService.updateState({
          onboardingCompleted: AccountService.readsAsOnboarded(account),
          accountEmail: account.email ?? '',
        });
      }

      // Pre-sync builds kept this config on local disk only. If the account has none yet,
      // adopt the leftover local copy instead of presenting the user an empty profile.
      if (!interviewConfig) {
        const migration = await this.migrateLegacyConfig(account._id, generation);
        if (migration === 'migrated') return { success: true };
        if (migration === 'failed') {
          return { success: false, error: 'Failed to migrate local configuration' };
        }
      }

      // Success either way: the fetch itself worked, and if this read was superseded then what
      // is in state is newer than what this response carried.
      this.applyIfCurrent(
        generation,
        {
          fullName: interviewConfig?.full_name ?? '',
          profileData: interviewConfig?.profile_data ?? '',
          context: interviewConfig?.context ?? '',
        },
        true
      );
      if (interviewConfig) this.discardLegacyConfigIfOwned(account._id);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to fetch account' };
    }
  }

  /**
   * Push a pre-sync local config up to the account, once. The local copy is only
   * dropped after the backend confirms the write, so a failed migration is retried
   * on the next launch rather than losing the user's profile.
   *
   * 'none' means there was nothing local to migrate, which is distinct from a push
   * that failed: only the former should leave the user looking at a blank profile.
   *
   * The leftover copy is device-scoped, not account-scoped, so the first account offered
   * it claims it and it is never pushed anywhere else. Without that claim, a second
   * sign-in - a new signup, or another user on a shared machine - would inherit the first
   * user's CV, because a failed push deliberately keeps the copy around for retry. The
   * claim is persisted, since that retry can happen in a later run of the app.
   */
  private async migrateLegacyConfig(
    accountId: string,
    generation: number
  ): Promise<'migrated' | 'failed' | 'none'> {
    const legacy = getLegacyInterviewConf();
    const fullName = legacy?.username ?? '';
    const profileData = legacy?.profileData ?? '';
    const context = legacy?.jobDescription ?? '';
    if (!fullName && !profileData && !context) return 'none';

    const owner = getLegacyInterviewConfOwner();
    if (owner === null) {
      claimLegacyInterviewConf(accountId);
    } else if (owner !== accountId) {
      return 'none';
    }

    const result = await this.updateConfig(fullName, profileData, context);
    if (!result.success) {
      // Surface the local copy rather than an empty form, but leave it unloaded so the
      // dialog keeps Save disabled and retries the pull instead of letting the user
      // overwrite the account from a half-migrated state. Guarded like any other read: two
      // pulls can both reach this on first launch after upgrade, and a failed one must not
      // put Save back behind a lock the successful one just released.
      this.applyIfCurrent(generation, { fullName, profileData, context }, false);
      return 'failed';
    }

    clearLegacyInterviewConf();
    return 'migrated';
  }

  /**
   * Drop the pre-sync copy now that this account carries its own config.
   *
   * Gated on the claim: an unclaimed copy belongs to the first account offered it, same rule
   * migrateLegacyConfig applies, so this account may discard it. A copy claimed by a different
   * account is a migration that has not finished - a failed push deliberately keeps it for
   * retry - and deleting it here would lose that user's CV on a shared machine.
   *
   * Discarding an unclaimed copy does lose it: a user who upgrades a second device whose
   * account already synced from the first never sees that device's older local CV again. That
   * is the intended trade. Keeping it would leave it eligible for migration, and the next
   * account to sign in with an empty config would claim and inherit it - the cross-account
   * leak the claim exists to prevent. Losing a superseded copy beats leaking a live one.
   */
  private discardLegacyConfigIfOwned(accountId: string): void {
    const owner = getLegacyInterviewConfOwner();
    if (owner !== null && owner !== accountId) return;
    clearLegacyInterviewConf();
  }

  /**
   * Push local interview config changes to the backend, then mirror the
   * saved values into app state.
   */
  async updateConfig(
    fullName: string,
    profileData: string,
    context: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.updateInterviewConfig({
        full_name: fullName,
        profile_data: profileData,
        context,
      });
      if (response.error) {
        return { success: false, error: response.error.message || 'Failed to update account' };
      }

      // Mirror what the backend stored, not what was sent: it truncates oversized fields,
      // so echoing the request would leave the app showing a value the account does not have.
      const saved = response.data?.interview_config;
      this.generation++;
      appStateService.updateState({
        interviewConfig: {
          fullName: saved?.full_name ?? fullName,
          profileData: saved?.profile_data ?? profileData,
          context: saved?.context ?? context,
        },
        interviewConfigLoaded: true,
      });
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to update account' };
    }
  }

  /**
   * Full interview config for the configuration dialog.
   *
   * Always refreshes first: a save replaces the whole config, so editing a copy another device
   * has since changed would silently discard that change. `success` reports whether the values
   * are safe to save over, and requires *this* refresh to have succeeded - not just that
   * something was loaded earlier in the session. `interviewConfigLoaded` survives a failed pull
   * by design (it gates Start, which should keep working on a blip), so trusting it alone would
   * hand the dialog a stale copy with Save enabled and no warning, which is exactly how a newer
   * config saved on another device gets overwritten.
   */
  async getEditableConfig(): Promise<{
    success: boolean;
    data: InterviewConfig;
    error?: string;
  }> {
    const pull = await this.pullFromBackend();
    const state = appStateService.getState();
    const fresh = pull.success && state.interviewConfigLoaded;

    return {
      success: fresh,
      data: state.interviewConfig,
      error: fresh ? undefined : pull.error || 'Failed to load configuration',
    };
  }

  /**
   * Drop the signed-out account's config from memory. Nothing else resets it, so
   * without this the next user on this device inherits the previous user's profile
   * whenever their post-login pull fails, and can overwrite their own account with it.
   */
  clearState(): void {
    this.generation++;
    appStateService.updateState({
      interviewConfig: { fullName: '', profileData: '', context: '' },
      interviewConfigLoaded: false,
      // Reset with the rest of the account. Left standing, the next user to sign in on this
      // machine would inherit the previous one's answer and never be offered setup.
      onboardingCompleted: false,
      accountEmail: '',
    });
  }

  /**
   * Record that this account has finished (or deliberately skipped) the first-run wizard.
   *
   * Mirrored into app state only after the backend confirms the write. The renderer's gate reads
   * that state, so an optimistic update would let a failed write look like a completed setup
   * until the next launch pulled the account again and put the wizard back.
   *
   * **A `404` counts as written.** It is the other half of `readsAsOnboarded`: on a deployment
   * that predates this endpoint the flag is not a thing that can be recorded, and the same
   * deployment reports every account as onboarded anyway, so there is nothing for the write to
   * disagree with. Without this, Finish had no working exit on such a backend - it holds the
   * user in the wizard on a failed write, so the one screen the deployment cannot support was
   * also the one screen they could not leave except by skipping it.
   */
  async setOnboardingCompleted(
    completed: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.updateOnboarding({ completed });
      if (response.error && response.status !== 404) {
        return { success: false, error: response.error.message || 'Failed to save your setup' };
      }

      // Bumped for the same reason `updateConfig` bumps it: a pull that started before this
      // write is now stale, and letting it land afterwards would put the wizard back in front of
      // a user who has just finished it.
      this.generation++;
      appStateService.updateState({
        onboardingCompleted: response.data?.onboarding_completed ?? completed,
      });
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to save your setup' };
    }
  }
}

export const accountService = new AccountService();
