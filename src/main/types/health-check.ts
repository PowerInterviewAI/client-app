export interface ClientPingRequest {
  is_assistant_running: boolean;
}

export enum UserRole {
  User = 'user',
  TrialUser = 'trial_user',
  Admin = 'admin',
}

export interface ClientPingResponse {
  credits: number;
  provided_llm_model: string;
  user_role: UserRole;
}
