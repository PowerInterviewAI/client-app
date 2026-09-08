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

  /**
   * The same, minus a report already written to a file - see the main-process mirror for why the
   * two are separate. Guards and prompts read this one; the export surfaces read the one above.
   */
  hasUnsavedMockContent: boolean;

  /**
   * Whether the backend serves the mock-interview routes, or `null` while that is unknown.
   *
   * Only `false` is an answer to act on. See the main-process `AppState`'s docstring for why
   * `null` reads as available rather than as unavailable.
   */
  mockInterviewSupported: boolean | null;
  /**
   * What a mock interview costs per unit of work, or `undefined` before the backend has said.
   *
   * `undefined` means this backend predates per-turn pricing and still meters a mock session by
   * the minute, so the client quotes nothing and gates nothing - which is what it did before any
   * of this existed. Never read as free: a price of zero and no price at all are different
   * answers, and only one of them is a price.
   */
  mockPricing?: MockPricing;
}

/**
 * Credits per unit of mock-interview work, mirrored from the backend's ping response.
 *
 * A mock is priced by what it delivers rather than by the clock, because most of a mock session's
 * wall time is the product generating a question, speaking it, scoring the turn or writing the
 * report - none of which the candidate can act during - and the rest is think-time, which is the
 * behaviour the feature exists to train.
 */
export interface MockPricing {
  per_question: number;
  per_follow_up: number;
  per_report: number;
}

/**
 * What a mock interview of `questionCount` questions is guaranteed to cost: every question, and
 * the report at the end.
 *
 * This is the number the start gate reserves, and the promise it makes. Follow-ups are
 * deliberately not in it - they are charged as they are delivered and declined by the backend
 * when paying for one would eat into this, so quoting the worst case here would refuse a session
 * that will almost certainly not cost it.
 */
export function mockSessionPrice(pricing: MockPricing, questionCount: number): number {
  return pricing.per_question * questionCount + pricing.per_report;
}

/**
 * The most a session could cost if every question drew the maximum number of follow-ups.
 *
 * Shown alongside the guaranteed price rather than instead of it, because it is the number the
 * candidate is never charged more than - not the one they should expect to pay.
 */
export function mockSessionCeiling(
  pricing: MockPricing,
  questionCount: number,
  maxFollowUpsPerQuestion: number
): number {
  return (
    mockSessionPrice(pricing, questionCount) +
    pricing.per_follow_up * questionCount * maxFollowUpsPerQuestion
  );
}
