/**
 * App State Service
 * Central manager for application runtime state shared across main process
 */

import {
  ActionSuggestion,
  AppState,
  LiveSuggestion,
  RendererAppState,
  RunningState,
  Speaker,
  SuggestionState,
} from '../types/app-state.js';
import { DEFAULT_LANGUAGE } from '../types/language.js';
import { SuggestionMode } from '../types/llm.js';
import { getWindowReference, refreshWindowSurfaces } from './window-control.service.js';

const DEFAULT_STATE: AppState = {
  isStealth: false,
  isBackendLive: null,
  isLoggedIn: false,
  runningState: RunningState.Idle,
  transcripts: [],
  liveSuggestions: [],
  actionSuggestions: [],
  credits: undefined,
  userRole: undefined,
  providedLLMModel: undefined,
  interviewConfig: { fullName: '', profileData: '', context: '' },
  interviewConfigLoaded: false,
  onboardingCompleted: false,
  hasHistory: false,
  mockInterview: null,
  hasMockContent: false,
};

/** The three arrays a session fills, and that the placeholder seeds. */
const HISTORY_KEYS = ['transcripts', 'liveSuggestions', 'actionSuggestions'] as const;

/**
 * The two an export actually reads.
 *
 * `hasHistory` drives the save prompt and the export guard, and for both it has to mean "there
 * is an interview that saving would capture". `exportTranscript` builds the report from
 * transcripts and live suggestions alone - action suggestions have never been in it - so
 * counting them would offer to save something the save cannot contain, and would let the export
 * guard through on a session whose only content is a screenshot: a billed summarize call over
 * an empty transcript, writing a report out of nothing. That is the exact failure the guard
 * exists to stop, reached through a different door.
 */
const EXPORTABLE_KEYS = ['transcripts', 'liveSuggestions'] as const;
type ExportableKey = (typeof EXPORTABLE_KEYS)[number];

// Every broadcast structured-clones the whole renderer state, and they fire on each streamed
// token and each ASR partial - roughly 20/second across two channels, against a transcript array
// that grows for the whole interview. Coalescing bounds that cost per unit time instead of per
// event. Short enough that streaming still reads as streaming.
const BROADCAST_COALESCE_MS = 50;

export class AppStateService {
  private state: AppState;
  private broadcastTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Whether the history arrays currently hold the placeholder copy.
   *
   * Tracked here rather than inferred from the contents, because the placeholder is
   * indistinguishable from a one-line interview by shape and only this class ever writes it.
   */
  private placeholderActive = false;

  constructor() {
    this.state = { ...DEFAULT_STATE };
    this.setPlaceholderState();
  }

  setPlaceholderState() {
    this.placeholderActive = true;
    const tstampNow = Date.now();
    this.state = {
      ...this.state,
      // Set placeholder data to make it easier to visualize the UI during development
      transcripts: [
        {
          timestamp: tstampNow,
          text: 'Transcripts will be here',
          speaker: Speaker.Other,
          isFinal: false,
          endTimestamp: tstampNow + 5000,
          language: DEFAULT_LANGUAGE,
        },
      ],
      liveSuggestions: [
        {
          timestamp: tstampNow,
          last_question: 'Interviewer questions will be here',
          answer: 'Suggested answers will be here in real-time',
          state: SuggestionState.Success,
          error: '',
          mode: SuggestionMode.FullSentence,
        },
      ],
      actionSuggestions: [
        {
          timestamp: tstampNow,
          last_question: 'Interviewer questions will be here',
          answer:
            'Triggered suggestions will be here. For example, reply suggestion, coding test solution, diagram descriptions, etc.',
          image_urls: [null, null, null, null],
          state: SuggestionState.Success,
          error: '',
        },
      ],
      // Sample copy is not an interview. Everything that destroys history asks to save it
      // first, and this is the state a freshly launched app sits in.
      hasHistory: false,
    };
    // Clear reaches main and resets the state here, but the renderer only ever learns about
    // state through this broadcast - it does not poll while the push API exists. Without this
    // the panels keep rendering pre-Clear content until some unrelated change broadcasts.
    this.notifyRenderer();
  }

  getState(): AppState {
    return { ...this.state };
  }

  /**
   * The state as the renderer sees it. Keeps the CV and job description out of IPC: they can
   * run to hundreds of KB and every state change broadcasts the whole object.
   */
  getRendererState(): RendererAppState {
    const { interviewConfig, ...rest } = this.state;
    return {
      ...rest,
      interviewConfig: {
        fullName: interviewConfig.fullName,
        // Length first: this runs on every broadcast, and trimming a 128,000-character CV to
        // learn it is non-empty copies the whole string. The empty case is the only one that
        // needs the trim at all, to keep whitespace from reading as a set profile.
        hasProfileData:
          interviewConfig.profileData.length > 0 && interviewConfig.profileData.trim() !== '',
      },
    };
  }

  /**
   * Fold a write into `updates` so that `hasHistory` follows it.
   *
   * Only the transcript and suggestion services write the history keys, and they only ever
   * write real interview content - the placeholder comes from here alone. So a write to any
   * one of them retires the placeholder, and the flag is recomputed from what the write leaves
   * behind rather than tracked by each caller.
   *
   * The untouched arrays are emptied along with it. `clearAll` runs before every session so
   * that mixed state is not reachable in practice, but a real transcript sitting beside two
   * lines of sample suggestion copy is the one shape that would put placeholder text into an
   * exported report.
   */
  private withHistory(updatesIn: Partial<AppState>): Partial<AppState> {
    // Derived here and nowhere else. It crosses IPC inside a `Partial<AppState>` the renderer
    // composes, and the close guard trusts it, so a caller that set it - by mistake, or by
    // echoing back state it was sent - would switch the save prompt off with no symptom.
    const next: Partial<AppState> = { ...updatesIn };
    delete next.hasHistory;

    const touched = HISTORY_KEYS.filter((key) => next[key] !== undefined);
    if (touched.length === 0) return next;

    if (this.placeholderActive) {
      for (const key of HISTORY_KEYS) {
        if (!touched.includes(key)) next[key] = [] as never;
      }
      this.placeholderActive = false;
    }

    next.hasHistory = EXPORTABLE_KEYS.some(
      (key: ExportableKey) => (next[key] ?? this.state[key]).length > 0
    );
    return next;
  }

  /**
   * Fold a `mockInterview` write into `updates` so that `hasMockContent` follows it, the same
   * mechanism `withHistory` is for the live transcript.
   *
   * Independent of `hasHistory` on purpose: a mock session and a live interview never run at the
   * same time (mutual exclusion is enforced elsewhere), but they are still two separate things a
   * close can destroy, and conflating them would let one mask the other in the guard that reads
   * them.
   */
  private withMockContent(updatesIn: Partial<AppState>): Partial<AppState> {
    const next: Partial<AppState> = { ...updatesIn };
    // Derived here and nowhere else, for the same reason `hasHistory` is stripped above: this
    // crosses IPC inside a `Partial<AppState>` the renderer composes, and the close guard trusts
    // it - a caller that set it directly would switch the save prompt off with no symptom.
    delete next.hasMockContent;

    if (next.mockInterview === undefined) return next;

    const session = next.mockInterview;

    // `ingestAnswer` broadcasts roughly 20 times a second while the candidate is talking, and
    // every one of those carries a `mockInterview` payload - but `answers` is only ever
    // reassigned (a new array) when a turn actually completes, never by `ingestAnswer` itself, so
    // an unchanged reference means the derived value below cannot have changed either. Skipping
    // the rescan on the hot path avoids trimming every answer string ~20 times a second for a
    // boolean that changes at most once per turn.
    if (session?.answers === this.state.mockInterview?.answers) {
      next.hasMockContent = this.state.hasMockContent;
      return next;
    }

    // A skipped question is not content: `answer` is empty for those by construction, so the
    // trim check already excludes them without needing to read the `skipped` flag directly.
    next.hasMockContent =
      session !== null && session.answers.some((a) => !a.skipped && a.answer.trim().length > 0);

    return next;
  }

  updateState(updatesIn: Partial<AppState>): AppState {
    const updates = this.withMockContent(this.withHistory(updatesIn));

    // The health-check loops re-report identical values every 1-5s. Broadcasting those would
    // re-render every subscriber for nothing, so only notify when something actually moved.
    const changed = (Object.keys(updates) as (keyof AppState)[]).some(
      (key) => !Object.is(this.state[key], updates[key])
    );

    const runningChanged =
      updates.runningState !== undefined && updates.runningState !== this.state.runningState;

    this.state = { ...this.state, ...updates };
    if (changed) {
      this.notifyRenderer();
    }

    // The taskbar button, the Dock icon and always-on-top follow the running state as well as
    // stealth, and this is the only place a run starts or ends. Done after the state is written,
    // since window-control reads it back. Never allowed to fail the update itself.
    if (runningChanged) {
      try {
        refreshWindowSurfaces();
      } catch (e) {
        console.warn('Failed to refresh window surfaces:', e);
      }
    }

    return this.getState();
  }

  private notifyRenderer(): void {
    if (this.broadcastTimer) return;

    this.broadcastTimer = setTimeout(() => {
      this.broadcastTimer = null;
      this.sendToRenderer();
    }, BROADCAST_COALESCE_MS);
  }

  /**
   * Send a pending broadcast immediately, if one is scheduled.
   *
   * Coalescing means a caller that needs the renderer to have the current state right now - a
   * test, or a shutdown path - cannot simply wait. Deliberately a no-op when nothing is
   * pending, so flushing cannot manufacture a broadcast that the change detection suppressed.
   */
  flushRenderer(): void {
    if (!this.broadcastTimer) return;

    clearTimeout(this.broadcastTimer);
    this.broadcastTimer = null;
    this.sendToRenderer();
  }

  /**
   * The actual send. Separate from flushRenderer because the two callers disagree about the
   * pending check: flushRenderer needs it, the timer callback must not have it. Folding the
   * send into flushRenderer meant the timer cleared its own handle and then called a method
   * guarded on that handle, so the coalesced path - the only one production uses - silently
   * sent nothing at all.
   */
  private sendToRenderer(): void {
    try {
      const win = getWindowReference();
      if (win && !win.isDestroyed()) {
        win.webContents.send('app:state-updated', this.getRendererState());
      }
    } catch (e) {
      console.warn('Failed to broadcast app state update:', e);
    }
  }

  addLiveSuggestion(s: LiveSuggestion): void {
    this.updateState({ liveSuggestions: [...this.state.liveSuggestions, s] });
  }

  addActionSuggestion(s: ActionSuggestion): void {
    this.updateState({ actionSuggestions: [...this.state.actionSuggestions, s] });
  }
}

export const appStateService = new AppStateService();
