/**
 * Application State Types
 */

export enum Speaker {
  Self = 'self',
  Other = 'other',
}

export enum SuggestionState {
  Idle = 'idle',
  Uploading = 'uploading',
  Pending = 'pending',
  Loading = 'loading',
  Success = 'success',
  Stopped = 'stopped',
  Error = 'error',
}

export enum RunningState {
  Idle = 'idle',
  Starting = 'starting',
  Running = 'running',
  Stopping = 'stopping',
}

export interface Transcript {
  timestamp: number;
  text: string;
  speaker: Speaker;
  isFinal: boolean;
  endTimestamp: number;
}

export interface LiveSuggestion {
  timestamp: number;
  last_question: string;
  answer: string;
  state: SuggestionState;
}

export interface ActionSuggestion {
  timestamp: number;
  last_question: string;
  answer: string;
  image_urls: (string | null)[];
  state: SuggestionState;
}

export interface AppState {
  isStealth: boolean;
  isBackendLive: boolean;
  isGpuServerLive: boolean;
  isLoggedIn: boolean | null;
  runningState: RunningState;
  isAppIdle: boolean;
  transcripts: Transcript[];
  liveSuggestions: LiveSuggestion[];
  actionSuggestions: ActionSuggestion[];
  credits?: number;
  providedLLMModel?: string;
}
