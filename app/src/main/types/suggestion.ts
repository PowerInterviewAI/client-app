import { Transcript } from './app-state.js';

export interface GenerateLiveSuggestionRequest {
  profile_data: string;
  context: string;
  transcripts: Transcript[];
}

// action request reuses live fields but adds image names
export interface GenerateActionSuggestionRequest extends GenerateLiveSuggestionRequest {
  image_names: string[];
}
