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
  created_at: number;
  updated_at: number | null;
}

export interface UpdateInterviewConfigRequest {
  full_name: string;
  profile_data: string;
  context: string;
}
