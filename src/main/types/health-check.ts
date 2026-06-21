export interface ClientPingRequest {
  is_assistant_running: boolean;
}

export enum UserRole {
  User = 'user',
  BetaTester = 'beta_tester',
  Admin = 'admin',
}

export interface ClientPingResponse {
  credits: number;
  provided_llm_model: string;
  user_role: UserRole;
  beta_tester_expires_at: number;
}
