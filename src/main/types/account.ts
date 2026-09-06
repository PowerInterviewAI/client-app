/**
 * Account Types
 */

export interface InterviewConfig {
  full_name: string;
  profile_data: string;
  context: string;
}

export interface UserAccount {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  credits: number;
  interview_config: InterviewConfig | null;
  /**
   * Whether the client's first-run setup has been finished or skipped for this account.
   *
   * Account-level rather than device-level, so it follows the user to a new machine and a second
   * account on a shared one gets its own run of the wizard. Absent on a response from a backend
   * that predates the field, which reads the same as false - the wizard is offered once.
   */
  onboarding_completed?: boolean;
  created_at: number;
  updated_at: number | null;
}

export interface UpdateInterviewConfigRequest {
  full_name: string;
  profile_data: string;
  context: string;
}

export interface UpdateOnboardingRequest {
  completed: boolean;
}
