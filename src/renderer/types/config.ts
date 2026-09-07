import type { Language } from './language';

export type { Language };

export interface Config {
  // Interview language: what the ASR transcribes and what suggestions come back in.
  language: Language;

  // Authentication
  sessionToken: string;
  email: string;
  password: string;
  rememberMe: boolean;

  // Transcription options
  audioInputDeviceName: string;

  // Panel auto-scroll preferences (persisted between sessions)
  autoScrollLiveSuggestions: boolean;
  autoScrollActionSuggestions: boolean;
  autoScrollTranscript: boolean;

  // Transcription bottom dock visibility (persisted between sessions)
  showTranscriptPanel: boolean;

  // Height the user dragged the transcription dock to, in px. null means automatic sizing.
  transcriptDockHeight: number | null;

  // Hint-only mode: suggestions come back as a headline plus keyword bullets rather than full
  // sentences. The default; full-sentence mode is the opt-out.
  hintOnlyMode: boolean;


  // Mock interview: also show what the live assistant would have suggested. On by default.
  mockLiveSuggestionsEnabled: boolean;

}
