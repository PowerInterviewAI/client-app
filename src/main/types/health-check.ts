export interface ClientPingRequest {
  is_assistant_running: boolean;
}

export enum UserRole {
  User = 'user',
  TrialUser = 'trial_user',
  Admin = 'admin',
}

/**
 * What a mock interview costs, in credits per unit of work delivered.
 *
 * A mock is priced per question, follow-up and report rather than by the clock: most of a mock
 * session's wall time is the product generating a question, speaking it, scoring the turn or
 * writing the report, none of which the candidate can act during, and the rest is think-time,
 * which is the behaviour the feature exists to train.
 *
 * Sent on the ping because the client needs it before the candidate commits - the setup dialog
 * quotes the session and refuses one the balance cannot see through to its report.
 */
export interface MockPricing {
  per_question: number;
  per_follow_up: number;
  per_report: number;
}

export interface ClientPingResponse {
  credits: number;
  provided_llm_model: string;
  user_role: UserRole;
  /** Absent on a backend that predates per-turn pricing - see `AppState.mockPricing`. */
  mock_pricing?: MockPricing;
}
