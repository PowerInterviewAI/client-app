/**
 * Users API
 * Handles the authenticated user's account and interview configuration
 * (full name, profile, context)
 */

import { UpdateInterviewConfigRequest, UserAccount } from '../types/account.js';
import { ApiClient, ApiResponse } from './client.js';

export class UsersApi extends ApiClient {
  /**
   * Get the authenticated user's account
   */
  async getMe(): Promise<ApiResponse<UserAccount>> {
    return this.get<UserAccount>('/api/users/me');
  }

  /**
   * Replace the authenticated user's interview configuration
   */
  async updateInterviewConfig(data: UpdateInterviewConfigRequest): Promise<ApiResponse<UserAccount>> {
    return this.patch<UserAccount>('/api/users/me/interview-config', data);
  }
}
