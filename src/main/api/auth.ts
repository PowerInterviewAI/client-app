/**
 * Authentication API
 * Handles user authentication
 */

import { AuthToken, ChangePasswordRequest, LoginRequest, SignupRequest } from '../types/auth.js';
import { ApiClient, ApiResponse } from './client.js';

export class AuthApi extends ApiClient {
  /**
   * Login with credentials
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthToken>> {
    return this.post('/api/auth/login', credentials);
  }

  /**
   * Logout current session
   */
  async logout(): Promise<ApiResponse<void>> {
    return this.get<void>('/api/auth/logout');
  }

  /**
   * Signup new user
   */
  async signup(data: SignupRequest): Promise<ApiResponse<AuthToken>> {
    return this.post('/api/auth/signup', data);
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return this.post<void>('/api/auth/change-password', data);
  }
}
