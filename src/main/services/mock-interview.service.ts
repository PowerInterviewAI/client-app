import { ApiRequestError } from '../api/client.js';
import { LLMApi } from '../api/llm.js';
import { MockInterviewApi } from '../api/mock-interview.js';
import {
  LIVE_SUGGESTION_TTFB_MS,
  MOCK_ANSWER_SILENCE_MS,
  MOCK_LISTENING_SILENCE_MS,
  MOCK_MAX_FOLLOW_UPS_PER_QUESTION,
  SUGGESTION_STALL_MS,
} from '../consts.js';
import { configStore } from '../store/config.store.js';
import {
  LiveSuggestion,
  RunningState,
  Speaker,
  SuggestionState,
  Transcript,
} from '../types/app-state.js';
import { Language, TTS_LANGUAGES } from '../types/language.js';
import { GenerateLiveSuggestionRequest, RequestTurnVerdict, SuggestionMode } from '../types/llm.js';
import {
  EvaluateMockTurnRequest,
  GenerateMockQuestionRequest,
  GenerateMockReportRequest,
  isMockInterviewSessionActive,
  MockAnswer,
  MockCurrentQuestion,
  MockInterviewSessionState,
  MockInterviewSetup,
  MockInterviewState,
  MockQuestionKind,
  MockTurnAction,
} from '../types/mock-interview.js';
import { splitIntoSpeechChunks } from '../utils/speech-chunks.js';
import { getSuggestionErrorMessage } from '../utils/suggestion-error.js';
import { transcriptSeparator } from '../utils/transcript-join.js';
import { appStateService } from './app-state.service.js';

/**
 * A description of a failed request that names what actually went wrong.
 *
 * `ApiRequestError.message` is only the HTTP status text ("Unprocessable Entity"), which does not
 * distinguish the cases a user can act on - a session that has expired, a field this build sends
 * that the deployed backend rejects, a provider outage - so the status and the body come with it.
 * The body is what carries a validation error's actual field, and is bounded because it is put in
 * front of a person.
 */
function describeApiError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const body =
      typeof error.content === 'string' ? error.content : JSON.stringify(error.content ?? '');
    const detail = body && body !== '""' ? ` - ${body.slice(0, 300)}` : '';
    return `${error.status} ${error.message}${detail}`;
  }
  return error instanceof Error ? error.message : String(error);
}

function initialSession(): MockInterviewSessionState {
  return {
    state: MockInterviewState.Idle,
    setup: null,
    currentQuestion: null,
    questionNumber: 0,
    answers: [],
    currentAnswerText: '',
    liveHints: [],
    report: null,
    reportError: null,
    error: null,
  };
}

/**
 * The mock interview's state machine and in-memory session.
 *
 * Mirrors the terminal-state invariant `use-assistant-service.ts` documents for `RunningState`:
 * whatever fails on the way, the state always lands on `Idle` or `Finished`, and no control is
 * left permanently disabled. `sessionSeq` is the generation token that makes that safe against
 * overlapping async calls - the same shape `switchSeq` gives `AudioWsStream` in the renderer - so
 * a response for a session that has since ended or restarted is discarded rather than applied.
 *
 * Fully ephemeral: nothing here is written to Mongo or to disk. It never calls `transcriptService`
 * or `appStateService`'s `transcripts`/`liveSuggestions` keys, so a mock session cannot flip
 * `hasHistory` or enter the live transcript export.
 */
class MockInterviewService {
  private api = new MockInterviewApi();
  private llmApi = new LLMApi();
  private session: MockInterviewSessionState = initialSession();
  private sessionSeq = 0;
  private followUpCount = 0;
  private finalAnswerText = '';
  /** Why the last question generation failed, for the message the setup screen shows. */
  private lastQuestionError = '';
  private silenceTimer: NodeJS.Timeout | null = null;
  /** Captured at `start()` and fixed for the session - see the docstring on `start`. */
  private language: Language = Language.English;

  /**
   * One hint per question, keyed by its own timestamp the way `LiveSuggestionService` keys its
   * suggestions - a Map rather than mutating `session.liveHints` in place, so a superseded stream
   * (skip/next while a hint is still generating) cannot resurrect a hint for a question the
   * candidate has already moved past.
   */
  private hintsByTimestamp: Map<number, LiveSuggestion> = new Map();
  /** The one hint that can be generating at a time - questions are asked one at a time. */
  private hintAbortController: AbortController | null = null;

  isActive(): boolean {
    return isMockInterviewSessionActive(this.session);
  }

  private broadcast(): void {
    appStateService.updateState({ mockInterview: { ...this.session } });
  }

  private setState(state: MockInterviewState): void {
    this.session = { ...this.session, state };
  }

  /**
   * Start a new session.
   *
   * The language is read once, here, and held for the rest of the session rather than re-read
   * from `configStore` on every request: it selects the TTS voice as well as the question
   * generation language, so switching it mid-session would leave a voice reading questions in a
   * language it was never chosen for. The setup screen is the only place it is chosen.
   */
  async start(setup: MockInterviewSetup): Promise<void> {
    if (this.isActive()) return;

    // Mutually exclusive with the live assistant, for the same reason use-assistant-service.ts's
    // startAssistant() refuses while a mock session is active: both want the microphone and an
    // ASR socket, and running both would bill twice. That check only protects the other
    // direction - there is no start hotkey into a mock session for it to intercept the way it
    // intercepts every route into the live assistant, so this side needed its own guard.
    if (appStateService.getState().runningState !== RunningState.Idle) {
      throw new Error('Stop the live interview before starting a mock interview.');
    }

    const seq = ++this.sessionSeq;
    this.followUpCount = 0;
    this.finalAnswerText = '';
    this.lastQuestionError = '';
    this.stopLiveHint();
    this.hintsByTimestamp.clear();
    this.language = configStore.getConfig().language;
    this.session = { ...initialSession(), setup, state: MockInterviewState.Starting };
    this.broadcast();

    try {
      this.setState(MockInterviewState.Generating);
      this.broadcast();
      await this.generateNextQuestion(seq, /* isFollowUp */ false);

      // generateNextQuestion fails forward to Scoring (and, with nothing yet answered, straight
      // to Idle) rather than throwing - the right behaviour mid-session, where a skip or a
      // "next" already has a report's worth of progress to fall back on. The very first question
      // has none: landing back on Idle here is not a graceful degradation, it is Start doing
      // nothing with no explanation, so this is the one call site that turns that silence into
      // an error the setup screen can show.
      if (seq === this.sessionSeq && this.session.state === MockInterviewState.Idle) {
        // Carrying what actually failed, not just that something did. Both attempts are gone by
        // here and the reason was the one thing the candidate was never told - which, for the
        // failures this hits in practice (a session that has expired, a request a deployed
        // backend rejects), is the whole of what they need to act on.
        throw new Error(
          this.lastQuestionError
            ? `Could not generate the first question: ${this.lastQuestionError}`
            : 'Failed to generate the first question. Please try again.'
        );
      }
    } catch (error) {
      if (seq !== this.sessionSeq) return;
      this.session = {
        ...initialSession(),
        error: error instanceof Error ? error.message : 'Failed to start the mock interview',
      };
      this.broadcast();
      throw error;
    }
  }

  /**
   * Fetch and install the next question, advancing `questionNumber` unless it is a follow-up.
   *
   * Shared by session start, "next", and skip - all three want the same thing: ask the backend
   * for a question given what has been asked so far, then decide whether it can be spoken.
   */
  private async generateNextQuestion(seq: number, isFollowUp: boolean): Promise<void> {
    if (!this.session.setup) return;

    const interviewConfig = appStateService.getState().interviewConfig;

    const request: GenerateMockQuestionRequest = {
      language: this.language,
      setup: this.session.setup,
      profile_data: interviewConfig.profileData,
      context: interviewConfig.context,
      history: this.session.answers.map((a) => ({ question: a.question, answer: a.answer })),
      // The number this question will carry once installed. `installQuestion` advances the
      // counter only for a new question, so a follow-up keeps the one on screen.
      question_number: isFollowUp ? this.session.questionNumber : this.session.questionNumber + 1,
    };

    let attempt = 0;
    // One retry, then fall through to scoring with whatever answers exist - a session that
    // cannot get a single further question generated is unrecoverable by retrying forever, and
    // the answers already given are worth a report more than an endless spinner is worth trying.
    for (;;) {
      try {
        const response = await this.api.generateQuestion(request);
        if (seq !== this.sessionSeq) return;
        if (response.error || !response.data) {
          throw new Error(response.error?.message || 'Failed to generate the next question');
        }
        this.installQuestion(response.data.text, response.data.kind, isFollowUp);
        return;
      } catch (error) {
        if (seq !== this.sessionSeq) return;

        // The failure the candidate actually meets, and the only path in this service that
        // recorded nothing whatsoever: a bare `catch {}` discarded the reason, so a question that
        // could not be generated - a rejected request, an expired session, a provider error -
        // reached the screen as "please try again" with nothing anywhere saying what to try
        // differently, and nothing in the log to read afterwards either.
        this.lastQuestionError = describeApiError(error);
        console.error(
          `[MockInterviewService] question generation failed (attempt ${attempt + 1}): ${this.lastQuestionError}`,
          error
        );

        attempt += 1;
        if (attempt > 1) {
          await this.finishToScoring(seq);
          return;
        }
      }
    }
  }

  /**
   * Silence backstop, covering two different ways "Done answering" never gets pressed.
   *
   * Armed at two points, with two different delays and a shared decision at the deadline: if
   * `finalAnswerText` holds anything, treat it as "Done answering" was pressed
   * (`answerFinished()`); if it is still empty, there is nothing to submit, so treat it as
   * "Skip question" instead (`skipQuestion()`).
   *
   * - `ingestAnswer`, once real speech has actually arrived, with `MOCK_ANSWER_SILENCE_MS` - a
   *   candidate who stops talking without pressing the button. Short, because the candidate is
   *   mid-answer and has already engaged.
   * - Entering `Listening` with nothing said yet (`installQuestion` for a text-only question,
   *   `speechFinished`/`speechFailed` for a voiced one), with the far longer
   *   `MOCK_LISTENING_SILENCE_MS` - a dead microphone that produces no transcript at all, not a
   *   candidate who is merely thinking. Without this half, a mic that failed before the candidate
   *   said a word left the session waiting forever, recoverable only by noticing and clicking
   *   "Skip question" by hand.
   */
  private clearSilenceTimer(): void {
    if (this.silenceTimer !== null) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private armSilenceTimer(delayMs: number): void {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      this.silenceTimer = null;
      if (this.finalAnswerText.trim()) {
        void this.answerFinished();
      } else {
        void this.skipQuestion();
      }
    }, delayMs);
  }

  private installQuestion(text: string, kind: MockQuestionKind, isFollowUp: boolean): void {
    this.clearSilenceTimer();
    const hasAudio = TTS_LANGUAGES.has(this.language);
    const question: MockCurrentQuestion = {
      text,
      kind,
      hasAudio,
      isFollowUp,
      chunks: hasAudio ? splitIntoSpeechChunks(text, this.language) : [],
    };

    this.finalAnswerText = '';
    if (!isFollowUp) {
      this.followUpCount = 0;
      this.session = { ...this.session, questionNumber: this.session.questionNumber + 1 };
    }

    this.session = {
      ...this.session,
      currentQuestion: question,
      currentAnswerText: '',
      state: hasAudio ? MockInterviewState.Speaking : MockInterviewState.Listening,
    };
    // Not armed here for a no-audio question: the renderer gates a question with no audio behind
    // its own "I'm ready" confirmation (session.tsx), and arming the silence backstop before the
    // candidate has even said they are ready to answer starts counting down against time spent
    // reading the question, not against silence after being asked for an answer - a long question
    // could time out and auto-skip before "I'm ready" is ever clicked. `answerReady()` arms it
    // instead, at the same "candidate can now answer" moment `speechFinished`/`speechFailed` arm
    // it for a question that does have audio.
    this.broadcast();

    // The question text is already final the moment it is installed - unlike the live path,
    // there is no ASR to wait for - so the hint can start generating immediately rather than
    // waiting for Listening. Fire-and-forget: a hint is a bonus the candidate can read while they
    // answer, never something the turn itself waits on.
    void this.generateLiveHint(this.sessionSeq, text);
  }

  /** One chunk's audio, by index into the current question's `chunks`. Null if Aura has no voice. */
  async synthesizeChunk(index: number): Promise<ArrayBuffer | null> {
    const chunk = this.session.currentQuestion?.chunks[index];
    if (!chunk) return null;
    return this.api.speak({ text: chunk, language: this.language });
  }

  /** Playback of every chunk finished normally. */
  async speechFinished(): Promise<void> {
    if (this.session.state !== MockInterviewState.Speaking) return;
    this.enterListeningAfterSpeech();
  }

  /**
   * Playback failed - decode error, missing audio device, or a `synthesizeChunk` that itself
   * failed. Falls through to the text-only path for this question rather than stranding the
   * session: `hasAudio` flips to false so the renderer's "I'm ready" control appears in place of
   * the state it was waiting on the audio to reach.
   */
  async speechFailed(): Promise<void> {
    if (this.session.state !== MockInterviewState.Speaking) return;
    if (this.session.currentQuestion) {
      this.session = {
        ...this.session,
        currentQuestion: { ...this.session.currentQuestion, hasAudio: false },
      };
    }
    this.enterListeningAfterSpeech();
  }

  /**
   * The common tail of leaving `Speaking`, whether it ended normally or failed: move to
   * `Listening`, arm the backstop that catches a dead microphone or a candidate who never answers,
   * and tell the renderer. Split out so the one difference between `speechFinished` and
   * `speechFailed` - the `hasAudio` patch the latter applies first - is the only thing left in
   * either of them.
   */
  private enterListeningAfterSpeech(): void {
    this.setState(MockInterviewState.Listening);
    this.armSilenceTimer(MOCK_LISTENING_SILENCE_MS);
    this.broadcast();
  }

  /** A partial or final transcript segment of the answer in progress. */
  ingestAnswer(type: 'partial' | 'final', text: string): void {
    if (this.session.state !== MockInterviewState.Listening) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const sep = this.finalAnswerText ? transcriptSeparator(this.language) : '';

    if (type === 'final') {
      this.finalAnswerText = `${this.finalAnswerText}${sep}${trimmed}`;
      this.session = { ...this.session, currentAnswerText: this.finalAnswerText };
    } else {
      const partialSep = this.finalAnswerText ? transcriptSeparator(this.language) : '';
      this.session = {
        ...this.session,
        currentAnswerText: `${this.finalAnswerText}${partialSep}${trimmed}`,
      };
    }
    // The short deadline belongs to finals only, because the deadline's own decision does: it
    // submits when `finalAnswerText` holds something and *skips* when it does not. A partial
    // arming it therefore demoted the 60s think-time backstop to 8s on the strength of speech
    // that had not been finalised yet - and if that utterance never finalised (a dropped socket,
    // an utterance the ASR discarded) the deadline took the skip branch, recording the turn as
    // skipped and throwing away the words already on screen. A partial still re-arms the long
    // one: it is evidence the candidate is talking, which is a reason to keep waiting.
    this.armSilenceTimer(type === 'final' ? MOCK_ANSWER_SILENCE_MS : MOCK_LISTENING_SILENCE_MS);
    this.broadcast();
  }

  /** "Done answering" - evaluate the turn and advance. */
  async answerFinished(): Promise<void> {
    if (this.session.state !== MockInterviewState.Listening || !this.session.currentQuestion) {
      return;
    }
    this.clearSilenceTimer();
    const seq = this.sessionSeq;
    const question = this.session.currentQuestion;
    const answerText = this.finalAnswerText.trim();
    // Consumed now, not left for `installQuestion` to clear later: `endSession`'s "resurrect a
    // pending answer" branch below reads this same field, and the round trip to `evaluateTurn`
    // and then to the next `installQuestion` can take long enough for End to land in between -
    // finding this text still here and `currentQuestion` still pointing at the question it was
    // just folded into `answers` for, and pushing the identical answer a second time.
    this.finalAnswerText = '';

    const answer: MockAnswer = {
      question: question.text,
      kind: question.kind,
      answer: answerText,
      skipped: false,
    };
    this.session = { ...this.session, answers: [...this.session.answers, answer] };
    this.setState(MockInterviewState.Evaluating);
    this.broadcast();

    let action: MockTurnAction = MockTurnAction.Next;
    let followUpQuestion = '';
    try {
      const request: EvaluateMockTurnRequest = {
        language: this.language,
        question: question.text,
        answer: answerText,
        kind: question.kind,
        follow_up_count: this.followUpCount,
      };
      const response = await this.api.evaluateTurn(request);
      if (seq !== this.sessionSeq) return;
      if (response.data) {
        action = response.data.action;
        followUpQuestion = response.data.follow_up_question;
      }
    } catch {
      // Fails forward to NEXT - a stalled session is worse than moving on one question early.
      action = MockTurnAction.Next;
    }
    if (seq !== this.sessionSeq) return;

    if (
      action === MockTurnAction.FollowUp &&
      this.followUpCount < MOCK_MAX_FOLLOW_UPS_PER_QUESTION &&
      followUpQuestion
    ) {
      this.followUpCount += 1;
      this.installQuestion(followUpQuestion, question.kind, /* isFollowUp */ true);
      return;
    }

    if (action === MockTurnAction.Finish) {
      await this.finishToScoring(seq);
      return;
    }

    await this.advanceOrScore(seq);
  }

  /**
   * The candidate confirmed they are ready to answer a question that has no audio.
   *
   * Arms the silence backstop at the moment answering can actually start, the same moment
   * `speechFinished`/`speechFailed` arm it for a question that does have audio - see the comment
   * in `installQuestion` for why arming it any earlier (when the question is merely installed,
   * before the candidate has read it) is the bug this exists to avoid.
   */
  answerReady(): void {
    if (
      this.session.state !== MockInterviewState.Listening ||
      this.session.currentQuestion?.hasAudio
    ) {
      return;
    }
    this.armSilenceTimer(MOCK_LISTENING_SILENCE_MS);
  }

  /**
   * The candidate asked to hear the question again.
   *
   * Only the silence backstop cares, and it has to. The replay gates the microphone for its
   * whole duration, so nothing is transcribed and nothing re-arms the timer - while an
   * `MOCK_ANSWER_SILENCE_MS` deadline armed by whatever they said before pressing it keeps
   * counting, fires mid-question, and submits that half-finished answer as though they had
   * stopped talking. Re-armed at the listening delay, which is what "the question has just been
   * asked and nothing has been said since" means everywhere else this timer is set.
   */
  repeatQuestion(): void {
    if (this.session.state !== MockInterviewState.Listening) return;
    this.armSilenceTimer(MOCK_LISTENING_SILENCE_MS);
  }

  /** Skip the current question without an answer - always moves on, never follows up. */
  async skipQuestion(): Promise<void> {
    if (
      this.session.state !== MockInterviewState.Listening &&
      this.session.state !== MockInterviewState.Speaking
    ) {
      return;
    }
    this.clearSilenceTimer();
    const seq = this.sessionSeq;
    const question = this.session.currentQuestion;
    // A partial the candidate had spoken but not submitted no longer applies to a question they
    // just chose to skip - left alone, it is still here (and `currentQuestion` still names this
    // same question) for the entire `advanceOrScore` round trip, which is exactly the window
    // `endSession`'s "resurrect a pending answer" branch reads from. See `answerFinished` for the
    // same fix on the submit path.
    this.finalAnswerText = '';
    if (question) {
      const answer: MockAnswer = {
        question: question.text,
        kind: question.kind,
        answer: '',
        skipped: true,
      };
      this.session = { ...this.session, answers: [...this.session.answers, answer] };
    }
    await this.advanceOrScore(seq);
  }

  private async advanceOrScore(seq: number): Promise<void> {
    if (!this.session.setup) return;
    if (this.session.questionNumber >= this.session.setup.question_count) {
      await this.finishToScoring(seq);
      return;
    }
    this.setState(MockInterviewState.Generating);
    this.broadcast();
    await this.generateNextQuestion(seq, /* isFollowUp */ false);
  }

  private hasRealAnswers(): boolean {
    return this.session.answers.some((a) => !a.skipped && a.answer.trim().length > 0);
  }

  private async finishToScoring(seq: number): Promise<void> {
    if (seq !== this.sessionSeq) return;

    // The mock analogue of the export guard: a billed report call over a session with no real
    // answers would produce a document scoring an interview that did not happen.
    //
    // Reached without the user asking for it, though - the silence backstop skipping its way to
    // the end of a session nobody was heard in, which is what a dead microphone looks like from
    // here. Resetting silently put them back on the setup form with no explanation and nothing
    // to act on, so the reset carries the reason: `start()`'s own failure path already renders
    // `error` on that screen, and this is the same kind of dead end.
    if (!this.hasRealAnswers()) {
      const answered = this.session.answers.length > 0;
      this.session = {
        ...initialSession(),
        error: answered
          ? 'The interview ended with nothing recorded. Check that the right microphone is selected and that it is not muted, then try again.'
          : null,
      };
      this.broadcast();
      return;
    }

    this.setState(MockInterviewState.Scoring);
    this.broadcast();

    if (!this.session.setup) return;
    try {
      const interviewConfig = appStateService.getState().interviewConfig;
      const request: GenerateMockReportRequest = {
        language: this.language,
        setup: this.session.setup,
        profile_data: interviewConfig.profileData,
        context: interviewConfig.context,
        questions: this.session.answers.map((a) => ({ question: a.question, answer: a.answer })),
      };
      const response = await this.api.generateReport(request);
      if (seq !== this.sessionSeq) return;
      if (response.error || !response.data) {
        throw new Error(response.error?.message || 'Failed to score the interview');
      }
      this.session = {
        ...this.session,
        report: response.data,
        reportError: null,
        state: MockInterviewState.Finished,
      };
    } catch (error) {
      if (seq !== this.sessionSeq) return;
      this.session = {
        ...this.session,
        report: null,
        reportError: error instanceof Error ? error.message : 'Failed to score the interview',
        state: MockInterviewState.Finished,
      };
    }
    this.broadcast();
  }

  /**
   * End the session from any point. Scores whatever was answered so far, the same as reaching
   * the last question naturally - the answers already given are worth a report, not a discard.
   */
  async endSession(): Promise<void> {
    if (!this.isActive()) return;
    this.clearSilenceTimer();
    this.stopLiveHint();

    // Whatever the candidate has already said for the question on screen counts as an answer.
    // It was dropped: `finalAnswerText` is only folded into `answers` by `answerFinished`, so
    // ending part-way through the first answer left `hasRealAnswers()` false and the branch
    // below reset the whole session - no report, nothing to export, and the setup form back with
    // no explanation. The silence backstop already treats this same text as "Done answering",
    // which made the explicit End button the one path that threw it away.
    const pending = this.finalAnswerText.trim();
    if (pending && this.session.currentQuestion) {
      const question = this.session.currentQuestion;
      this.finalAnswerText = '';
      this.session = {
        ...this.session,
        answers: [
          ...this.session.answers,
          { question: question.text, kind: question.kind, answer: pending, skipped: false },
        ],
      };
    }

    // Ending *during* scoring abandons the report rather than starting another one. The control
    // bar deliberately leaves End reachable while an action is in flight - it is the way out of a
    // session that has stopped responding, and a hung report is one of the ways that happens - so
    // this is reachable, and falling through would discard the in-flight report only to bill a
    // second one for the same session. The answers are still on screen and still exportable,
    // which is what `reportError` already means everywhere else.
    if (this.session.state === MockInterviewState.Scoring) {
      this.sessionSeq += 1;
      this.session = {
        ...this.session,
        report: null,
        reportError: 'The interview was ended before scoring finished.',
        state: MockInterviewState.Finished,
      };
      this.broadcast();
      return;
    }

    const seq = ++this.sessionSeq;
    this.setState(MockInterviewState.Stopping);
    this.broadcast();

    if (!this.hasRealAnswers()) {
      this.session = { ...initialSession() };
      this.broadcast();
      return;
    }
    await this.finishToScoring(seq);
  }

  /**
   * Clear a finished (or never-started) session back to Idle.
   *
   * Called by both report-screen exits - "Practise again" and "Done" - so a finished session
   * cannot linger with `hasMockContent` still true after the user has moved past it, and so
   * "Practise again" never scores a new session's answers against the previous one's.
   */
  clear(): void {
    this.clearSilenceTimer();
    this.stopLiveHint();
    this.hintsByTimestamp.clear();
    this.sessionSeq += 1;
    this.followUpCount = 0;
    this.finalAnswerText = '';
    this.session = initialSession();
    this.broadcast();
  }

  getState(): MockInterviewSessionState {
    return { ...this.session };
  }

  /**
   * The language this session is actually running in - frozen at `start()`, not the live config.
   *
   * `exportMockReport` needs this rather than reading `configStore.getConfig().language` itself:
   * a `Finished` session sits on screen until the candidate navigates away or exports, and nothing
   * clears it just because the app's language setting changed in the meantime (`LanguageGroup` is
   * reachable again once the mock session stops holding the mic). Exporting with the live value
   * there would produce a report with headings in one language wrapped around a transcript and
   * questions generated in another - the exact "half-translated report" `export-labels.ts` exists
   * to prevent for the live path.
   */
  getLanguage(): Language {
    return this.language;
  }

  private stopLiveHint(): void {
    this.hintAbortController?.abort();
    this.hintAbortController = null;
  }

  private publishHints(seq: number): void {
    if (seq !== this.sessionSeq) return;
    this.session = { ...this.session, liveHints: Array.from(this.hintsByTimestamp.values()) };
    this.broadcast();
  }

  /**
   * Build the transcript `GenerateLiveSuggestionRequest` expects out of the session so far, ending
   * on the question just asked. Every prior turn is included, unlike the live path's rolling
   * `TRANSCRIPT_UPLOAD_LIMIT` window - a mock session runs a handful of questions, not an hour of
   * conversation, so there is nothing to trim.
   */
  private buildHintTranscripts(question: string): Transcript[] {
    const transcripts: Transcript[] = [];
    let t = 0;
    for (const a of this.session.answers) {
      transcripts.push({
        timestamp: t++,
        text: a.question,
        speaker: Speaker.Other,
        isFinal: true,
        endTimestamp: t,
        language: this.language,
      });
      if (a.answer) {
        transcripts.push({
          timestamp: t++,
          text: a.answer,
          speaker: Speaker.Self,
          isFinal: true,
          endTimestamp: t,
          language: this.language,
        });
      }
    }
    transcripts.push({
      timestamp: t++,
      text: question,
      speaker: Speaker.Other,
      isFinal: true,
      endTimestamp: t,
      language: this.language,
    });
    return transcripts;
  }

  /**
   * What the live assistant would have suggested for this question - the same request
   * `LiveSuggestionService` makes, aimed at the mock session's own history instead of the live
   * transcript, and written to `session.liveHints` rather than `AppState.liveSuggestions` so a
   * mock session never touches the live panels or `hasHistory` (see the class docstring).
   *
   * `turn_verdict` is always `Answer`: every question here is the interviewer's whole turn, never
   * an ASR fragment, so there is nothing for the backend's own classifier to resolve - unlike the
   * live path, this never reaches `NO_SUGGESTION_NEEDED`.
   *
   * No render-delay gate either. That exists on the live path to stop a card flashing onto screen
   * only to be retracted when the backend's speculative classifier suppresses the turn a moment
   * later - `Answer` skips that classifier entirely, so there is nothing here to be retracted.
   */
  private async generateLiveHint(seq: number, question: string): Promise<void> {
    // Before the toggle is read, not after. The previous question's hint is superseded by this
    // question whether or not a new one is generated, and returning early on a toggle the
    // candidate switched off mid-session used to leave that stream running - still streaming,
    // still writing hints into the session state, for a panel that is no longer on screen.
    this.stopLiveHint();

    const conf = configStore.getConfig();
    if (!conf.mockLiveSuggestionsEnabled) return;

    const controller = new AbortController();
    this.hintAbortController = controller;

    const mode = conf.hintOnlyMode ? SuggestionMode.HintOnly : SuggestionMode.FullSentence;
    const timestamp = Date.now();
    const hint: LiveSuggestion = {
      timestamp,
      last_question: question,
      answer: '',
      state: SuggestionState.Loading,
      error: '',
      mode,
    };
    this.hintsByTimestamp.set(timestamp, hint);
    this.publishHints(seq);

    let stallTimer: NodeJS.Timeout | null = null;
    const armStallTimer = (ms: number): void => {
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        controller.abort(new DOMException('stalled', 'TimeoutError'));
      }, ms);
    };

    try {
      const interviewConfig = appStateService.getState().interviewConfig;
      const requestBody: GenerateLiveSuggestionRequest = {
        profile_data: interviewConfig.profileData,
        context: interviewConfig.context,
        transcripts: this.buildHintTranscripts(question),
        mode,
        turn_verdict: RequestTurnVerdict.Answer,
        language: this.language,
      };

      armStallTimer(LIVE_SUGGESTION_TTFB_MS);
      const response = await this.llmApi.generateLiveSuggestions(requestBody, controller.signal);
      if (!response) throw new Error('No response from suggestion API');

      const reader = response.getReader();
      const decoder = new TextDecoder('utf-8');
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            armStallTimer(SUGGESTION_STALL_MS);
            hint.answer += decoder.decode(value, { stream: true });
            this.publishHints(seq);
          }
        }
        if (hint.answer.length === 0) {
          hint.state = SuggestionState.Error;
          hint.error = 'The model returned an empty response.';
        } else {
          hint.state = SuggestionState.Success;
        }
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    } catch (error) {
      // Keyed on the signal rather than the error, the same way the live path reads it: an abort
      // rejects with its *reason*, so a stall surfaces as TimeoutError and a check on the error
      // itself would miss it.
      const aborted = controller.signal.aborted;
      const stalled =
        aborted &&
        controller.signal.reason instanceof Error &&
        controller.signal.reason.name === 'TimeoutError';

      if (aborted && !stalled) {
        // Superseded by the next question before this one finished streaming. Left on screen as
        // Stopped rather than removed - the panel already knows how to render an unfinished card,
        // and a hint vanishing the moment the candidate moves on reads as a bug, not a feature.
        hint.state = SuggestionState.Stopped;
      } else {
        hint.state = SuggestionState.Error;
        hint.error = stalled
          ? 'The response timed out. Please try again.'
          : getSuggestionErrorMessage(error);
      }
    } finally {
      if (stallTimer) clearTimeout(stallTimer);
      if (this.hintAbortController === controller) this.hintAbortController = null;
    }
    this.publishHints(seq);
  }
}

export const mockInterviewService = new MockInterviewService();
