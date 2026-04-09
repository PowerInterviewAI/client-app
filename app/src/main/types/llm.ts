import { Transcript } from './app-state.js';

export enum LLMProvider {
  NONE = 'none',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GROQ = 'groq',
}

export enum LLMModality {
  TEXT_INPUT = 'text_input',
  IMAGE_INPUT = 'image_input',
  TEXT_OUTPUT = 'text_output',
  IMAGE_OUTPUT = 'image_output',
  AUDIO_INPUT = 'audio_input',
  AUDIO_OUTPUT = 'audio_output',
}

export interface LLMModelInfo {
  id: string;
  provider: string;
  name: string;
  description: string;
  modalities: string[];
  vision_capable: boolean;
  context_window: number;
  max_output_tokens: number;
  pricing_input: number;
  pricing_output: number;
  supports_streaming: boolean;
  supports_function_calling: boolean;
  supports_json_mode: boolean;
  release_date: string | null;
}

export interface LLMConfig {
  provider: LLMProvider;
  apikey: string;
  model: string;
}

export interface LLMConfigValidationResult {
  provider_ok: boolean;
  apikey_ok: boolean;
  model_ok: boolean;
  error: string;
}

export interface LLMRequest {
  config: LLMConfig | null;
}

export interface GenerateLiveSuggestionRequest extends LLMRequest {
  profile_data: string;
  context: string;
  transcripts: Transcript[];
}

// action request reuses live fields but adds image names
export interface GenerateActionSuggestionRequest extends GenerateLiveSuggestionRequest {
  image_names: string[];
}

// summarize request reuses live fields
export interface GenerateSummarizeRequest extends LLMRequest {
  username: string;
  transcripts: Transcript[];
}
