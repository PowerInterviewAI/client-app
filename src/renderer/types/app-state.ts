import { type ActionSuggestion, type LiveSuggestion } from './suggestion';
import { type Transcript } from './transcript';

export enum RunningState {
  Idle = 'idle',
  Starting = 'starting',
  Running = 'running',
  Stopping = 'stopping',
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
  providedLLMModel?: string;
}
