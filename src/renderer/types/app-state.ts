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
  BetaTester = 'beta_tester',
  Admin = 'admin',
}

export interface AppState {
  isLoggedIn: boolean | null;
  isBackendLive: boolean;
  isGpuServerLive: boolean;
  runningState: RunningState;
  isAppIdle: boolean;
  transcripts: Transcript[];
  liveSuggestions: LiveSuggestion[];
  actionSuggestions: ActionSuggestion[];
  credits?: number;
  userRole?: UserRole;
  betaTesterExpiresAt?: number;
  providedLLMModel?: string;
}
