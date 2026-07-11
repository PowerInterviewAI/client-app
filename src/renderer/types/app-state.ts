import { type ActionSuggestion, type LiveSuggestion } from './suggestion';
import { type Transcript } from './transcript';

export enum RunningState {
  Idle = 'idle',
  Starting = 'starting',
  Running = 'running',
  Stopping = 'stopping',
}

export enum UserRole {
  User = 'user',
  TrialUser = 'trial_user',
  Admin = 'admin',
}

export interface AppState {
  isLoggedIn: boolean | null;
  isBackendLive: boolean;
  runningState: RunningState;
  transcripts: Transcript[];
  liveSuggestions: LiveSuggestion[];
  actionSuggestions: ActionSuggestion[];
  credits?: number;
  userRole?: UserRole;
  providedLLMModel?: string;
}
