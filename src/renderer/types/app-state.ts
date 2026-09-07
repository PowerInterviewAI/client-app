import { type MockInterviewSessionState } from './mock-interview';
import { type ActionSuggestion, type LiveSuggestion } from './suggestion';
import { type Transcript } from './transcript';

export enum RunningState {
  Idle = 'idle',
  Starting = 'starting',
  Running = 'running',
  Stopping = 'stopping',
}

export enum UserRole {
  User = 'user',
  TrialUser = 'trial_user',
  Admin = 'admin',
}

/** Full config, fetched on demand via `account.get()` - not carried in the app state. */
export interface InterviewConfig {
  fullName: string;
  profileData: string;
  context: string;
}

/**
 * What the app state carries about the interview config. The profile and context can run to
 * hundreds of KB, so main sends only what the UI renders and the dialog fetches the rest.
 */
export interface InterviewConfigSummary {
  fullName: string;
  hasProfileData: boolean;
}

export interface AppState {
  isLoggedIn: boolean | null;
  isBackendLive: boolean | null;
  runningState: RunningState;
  transcripts: Transcript[];
  liveSuggestions: LiveSuggestion[];
  actionSuggestions: ActionSuggestion[];
  credits?: number;
  userRole?: UserRole;
  providedLLMModel?: string;
  interviewConfig: InterviewConfigSummary;
  interviewConfigLoaded: boolean;
  /**
   * Whether the signed-in account has finished or skipped the first-run wizard.
   *
   * Only meaningful once `interviewConfigLoaded` is true - before that it is the default rather
   * than an answer, which is why the gate on `/` waits for both.
   */
  onboardingCompleted: boolean;
  /**
   * The signed-in account's email. Distinct from `Config.email`, which is a credential the login
   * form persists only under "remember me" - blank for a user who declined it, and stale for the
   * previous user until the next sign-in. Read this to display who is signed in.
   */
  accountEmail: string;
  /**
   * Whether the arrays above hold a real interview rather than the placeholder copy the panels
   * are seeded with. Derived in main; the renderer only reads it.
   */
  hasHistory: boolean;

  /** Null until a mock interview has been started at least once this launch. */
  mockInterview: MockInterviewSessionState | null;

  /**
   * Whether the mock session holds an answer worth protecting from an unasked close or a
   * navigation away from the screen. Derived in main from answers that carry real content -
   * see the main-process `AppState`'s docstring for why this is not simply `answers.length`.
   */
  hasMockContent: boolean;
}
