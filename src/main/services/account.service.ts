import { UsersApi } from '../api/users.js';
import { configStore } from '../store/config.store.js';

/**
 * AccountService
 * Keeps the local interviewConf (full name, profile, context) in sync with the
 * account persisted on the backend, so this config follows the user across devices.
 */
export class AccountService {
  private client = new UsersApi();

  /**
   * Pull the authenticated user's persisted account config from the backend
   * into the local store. Called after login so a device shows the same
   * config the user last saved anywhere.
   */
  async pullFromBackend(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.getMe();
      if (response.error || !response.data) {
        return { success: false, error: response.error?.message || 'Failed to fetch account' };
      }

      const interviewConfig = response.data.interview_config;
      configStore.updateConfig({
        interviewConf: {
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
   * saved values into the local store.
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

      configStore.updateConfig({ interviewConf: { fullName, profileData, context } });
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to update account' };
    }
  }
}

export const accountService = new AccountService();
