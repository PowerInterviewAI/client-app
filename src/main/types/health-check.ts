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
  /**
   * The price of an interview, live or mock, in credits per minute. Optional here even though the
   * backend always sends it now: this client ships independently of the hand-deployed backend,
   * so an older deployment still answers without it - see `AppState.creditsPerMinute` for the
   * fallback that case reads as.
   */
  credits_per_minute?: number;
}
