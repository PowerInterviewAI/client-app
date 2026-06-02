export enum SuggestionState {
  Idle = 'idle',
  Pending = 'pending',
  Loading = 'loading',
  Success = 'success',
  Stopped = 'stopped',
  Error = 'error',
}

export interface LiveSuggestion {
  timestamp: number;
  last_question: string;
  answer: string;
  state: SuggestionState;
  error: string;
}

export interface ActionSuggestion {
  timestamp: number;
  last_question: string;
  answer: string;
  image_urls: string[];
  state: SuggestionState;
  error: string;
}
