/**
 * Authentication Types
 */

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthToken {
  session_token: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
