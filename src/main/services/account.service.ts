import { UsersApi } from '../api/users.js';
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

  /**
   * Pull the authenticated user's persisted interview config from the backend
   * into app state. Called after login so a device shows the same config the
   * user last saved anywhere.
   */
  async pullFromBackend(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.getMe();
      if (response.error || !response.data) {
        return { success: false, error: response.error?.message || 'Failed to fetch account' };
      }

      const interviewConfig = response.data.interview_config;
      appStateService.updateState({
        interviewConfig: {
          fullName: interviewConfig?.full_name ?? '',
          profileData: interviewConfig?.profile_data ?? '',
          context: interviewConfig?.context ?? '',
        },
      });
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to fetch account' };
    }
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

      appStateService.updateState({ interviewConfig: { fullName, profileData, context } });
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to update account' };
    }
  }
}

export const accountService = new AccountService();
