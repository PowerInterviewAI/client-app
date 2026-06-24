import type { LLMConfig } from './llm';

export interface InterviewConf {
  username: string;
  profileData: string;
  jobDescription: string;
}

export enum Language {
  English = 'en',
}

export interface Config {
  interviewConf: InterviewConf;
  language: Language;

  // Authentication
  sessionToken: string;
  email: string;
  password: string;
  rememberMe: boolean;

  // Transcription options
  audioInputDeviceName: string;

  llmConf: LLMConfig | null;

  // Panel auto-scroll preferences (persisted between sessions)
  autoScrollLiveSuggestions: boolean;
  autoScrollActionSuggestions: boolean;
  autoScrollTranscript: boolean;
}
