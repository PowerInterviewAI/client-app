export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GROQ = 'groq',
  GOOGLE = 'google',
}

export interface LLMConfig {
  provider: LLMProvider;
  apikey: string;
  model: string;
}

export interface LLMModelInfo {
  id: string;
  provider: LLMProvider;
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

export interface LLMConfigValidationResult {
  provider_ok: boolean;
  apikey_ok: boolean;
  model_ok: boolean;
  error: string;
}
