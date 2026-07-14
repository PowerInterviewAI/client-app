/**
 * Authentication Types
 */

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  verification_code: string;
}
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SendVerificationCodeRequest {
  email: string;
}

export interface VerifyEmailCodeRequest {
  email: string;
  code: string;
}

export interface AuthToken {
  session_token: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
