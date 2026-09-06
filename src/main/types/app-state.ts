/**
 * Application State Types
 */

import { UserRole } from './health-check.js';
import { Language } from './language.js';
import { SuggestionMode } from './llm.js';
import { MockInterviewSessionState } from './mock-interview.js';

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
  /**
   * The interview language this text was transcribed in.
   *
   * Recorded per transcript rather than read from the config when it is needed, because the
   * setting moves mid-session and the text does not: whether two blocks are joined with a space
   * is a property of the words, not of what the picker says now. See `transcriptSeparator`.
   */
  language: Language;
}

export interface LiveSuggestion {
  timestamp: number;
  last_question: string;
  answer: string;
  state: SuggestionState;
  error: string;
  /**
   * The mode this answer was generated under, not the mode currently configured.
   *
   * The panel picks its renderer from this. Reading the live setting instead would re-render
   * every card on screen the moment the user toggles mid-interview, so a prose answer would
   * suddenly be parsed as Markdown.
   */
  mode: SuggestionMode;
}

export interface ActionSuggestion {
  timestamp: number;
  last_question: string;
  answer: string;
  image_urls: (string | null)[];
  state: SuggestionState;
  error: string;
}

export interface InterviewConfig {
  fullName: string;
  profileData: string;
  context: string;
}

/**
 * What the renderer is told about the interview config.
 *
 * The profile and context hold a full CV and job description (up to 128k chars each) and the
 * whole app state is broadcast on every change, so the bulk stays in the main process. The
 * configuration dialog fetches the full values on demand over `account:get`.
 */
export interface InterviewConfigSummary {
  fullName: string;
  hasProfileData: boolean;
}

export interface AppState {
  isStealth: boolean;
  isBackendLive: boolean | null;
  isLoggedIn: boolean | null;
  runningState: RunningState;
  transcripts: Transcript[];
  liveSuggestions: LiveSuggestion[];
  actionSuggestions: ActionSuggestion[];
  credits?: number;
  userRole?: UserRole;
  providedLLMModel?: string;
  interviewConfig: InterviewConfig;
  /** False until the account's config has been read this session; editing is unsafe before then. */
  interviewConfigLoaded: boolean;
  /**
   * Whether the signed-in account has finished or skipped the first-run wizard.
   *
   * Read off the account rather than local config, so it follows the user to a new machine and a
   * second account on a shared one gets its own run of it. Only meaningful once
   * `interviewConfigLoaded` is true - before that it is the default, not an answer, and the
   * renderer's gate waits for both.
   */
  onboardingCompleted: boolean;
  /**
   * Whether there is an interview that saving would actually capture.
   *
   * Derived, never set by a caller - `updateState` strips it off incoming updates. The panels
   * are seeded with one transcript and two suggestions so an empty app has something to show,
   * so a length check cannot tell an interview worth saving from the sample text, and
   * everything that destroys history asks before it does - a question nobody should be asked
   * about placeholder copy.
   *
   * Read from the transcripts and live suggestions only, because those are what the export
   * writes. Action suggestions are not in the report, so a session holding nothing else has
   * nothing to save.
   */
  hasHistory: boolean;

  /** Null until a mock interview session has been started at least once this launch. */
  mockInterview: MockInterviewSessionState | null;

  /**
   * Whether the mock session holds an answer worth protecting from an unasked close.
   *
   * Derived, never set by a caller - `updateState` strips it off incoming updates, the same way
   * `hasHistory` is. Based on answers that carry real content, not on `answers.length`: a
   * question the candidate skipped is not content, and a session where every question was
   * skipped has nothing a close prompt should protect. Independent of `hasHistory` - the two
   * guard different sessions and must not be combined into one signal-of-truth, only combined
   * at the one call site (the close guard) that has to ask "is there anything to lose at all".
   */
  hasMockContent: boolean;
}

/** The app state as sent to the renderer, with the interview config reduced to a summary. */
export type RendererAppState = Omit<AppState, 'interviewConfig'> & {
  interviewConfig: InterviewConfigSummary;
};
