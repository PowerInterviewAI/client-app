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
}

export interface ActionSuggestion {
  timestamp: number;
  image_urls: string[];
  suggestion_content: string;
  state: SuggestionState;
}
