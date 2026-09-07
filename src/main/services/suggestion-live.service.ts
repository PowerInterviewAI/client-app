import { LLMApi } from '../api/llm.js';
import {
  LIVE_SUGGESTION_RENDER_DELAY_MS,
  LIVE_SUGGESTION_TTFB_MS,
  SUGGESTION_STALL_MS,
  TRANSCRIPT_UPLOAD_LIMIT,
} from '../consts.js';
import { configStore } from '../store/config.store.js';
import { LiveSuggestion, Speaker, SuggestionState, Transcript } from '../types/app-state.js';
import { GenerateLiveSuggestionRequest, RequestTurnVerdict, SuggestionMode } from '../types/llm.js';
import { DateTimeUtil } from '../utils/datetime.js';
import { getSuggestionErrorMessage } from '../utils/suggestion-error.js';
import { isNoSuggestionSentinel } from '../utils/suggestion-sentinel.js';
import { UuidUtil } from '../utils/uuid.js';
import { appStateService } from './app-state.service.js';

class LiveSuggestionService {
  private llmApi: LLMApi = new LLMApi();
  private suggestions: Map<number, LiveSuggestion> = new Map();
  private abortMap: Map<string, AbortController> = new Map();

  // Bumped by clear(). An aborted task's rejection lands a microtask after clear() has emptied
  // the map, and without this its terminal write would re-insert a dead session's suggestion
  // into the freshly cleared state.
  private epoch = 0;

  async clear(): Promise<void> {
    this.epoch += 1;
    this.stopRunningTasks();
    this.suggestions.clear();
    // Update app state
    appStateService.updateState({ liveSuggestions: [] });
  }

  private appendSuggestion(timestamp: number, suggestion: LiveSuggestion, epoch: number): void {
    if (epoch !== this.epoch) {
      return;
    }

    if (isNoSuggestionSentinel(suggestion.answer)) {
      this.suggestions.delete(timestamp);
    } else {
      this.suggestions.set(timestamp, suggestion);
    }
    appStateService.updateState({
      liveSuggestions: Array.from(this.suggestions.values()),
    });
  }

  private async generateSuggestion(
    taskId: string,
    controller: AbortController,
    transcripts: Transcript[],
    turnVerdict: RequestTurnVerdict
  ): Promise<void> {
    // No empty-transcript guard here on purpose. startGenerateSuggestion already returns
    // before registering a task, and a second check would return ahead of the finally that
    // clears the abort map entry, leaking it.
    const epoch = this.epoch;
    const timestamp = DateTimeUtil.now();

    // Read once, up front. The card and the request must agree on the mode even if the user
    // toggles while this stream is in flight, or the panel would render prose as Markdown.
    const conf = configStore.getConfig();
    const mode = conf.hintOnlyMode ? SuggestionMode.HintOnly : SuggestionMode.FullSentence;

    const suggestion: LiveSuggestion = {
      timestamp,
      last_question: transcripts[transcripts.length - 1].text,
      answer: '',
      state: SuggestionState.Pending,
      error: '',
      mode,
    };

    // The card is *not* appended yet. A turn the backend suppresses resolves in a few hundred
    // milliseconds, and appending here would put a spinner on screen only to delete it again -
    // exactly the flicker the gate exists to remove. The card appears on whichever comes first:
    // real content, an error, or LIVE_SUGGESTION_RENDER_DELAY_MS of waiting, which is what keeps
    // a genuinely slow answer from looking like a dropped one.
    let renderTimer: NodeJS.Timeout | null = setTimeout(() => {
      renderTimer = null;
      this.appendSuggestion(timestamp, suggestion, epoch);
    }, LIVE_SUGGESTION_RENDER_DELAY_MS);

    // Every write after the first goes through here, so the pending card can never be scheduled
    // into existence after the sentinel has already decided there is nothing to show.
    const publish = (): void => {
      if (renderTimer) {
        clearTimeout(renderTimer);
        renderTimer = null;
      }
      this.appendSuggestion(timestamp, suggestion, epoch);
    };

    // Refresh a card that is already on screen, without bringing one into existence. Used for
    // state changes that carry nothing for the candidate to read.
    const refresh = (): void => {
      if (this.suggestions.has(timestamp)) {
        this.appendSuggestion(timestamp, suggestion, epoch);
      }
    };

    // A plain resettable timer, not a race against reader.read(): a losing read promise stays
    // pending and has already consumed a read request, so looping would leave two outstanding
    // reads on one reader. Aborting makes the read reject on its own.
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
        transcripts: transcripts.slice(-TRANSCRIPT_UPLOAD_LIMIT),
        mode,
        turn_verdict: turnVerdict,
        language: conf.language,
      };

      armStallTimer(LIVE_SUGGESTION_TTFB_MS);
      const response = await this.llmApi.generateLiveSuggestions(requestBody, controller.signal);
      if (!response) {
        throw new Error('No response from suggestion API');
      }

      const reader = response.getReader();
      const decoder = new TextDecoder('utf-8');

      // Promote out of Pending as soon as the response exists, not on the first chunk. A
      // stream that yields zero chunks used to leave the card Pending forever: the terminal
      // check below only fires for Loading, and no timeout rescues it because the stream
      // ended rather than stalled. An upstream that emits only a <think> block reaches here
      // with nothing to yield, since _strip_think_stream swallows the whole buffer.
      // Refresh, not publish. The response headers land before the backend's gate has decided
      // anything - it holds the body back, not the response - so publishing here would render
      // the exact card the delay above exists to withhold.
      suggestion.state = SuggestionState.Loading;
      refresh();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            armStallTimer(SUGGESTION_STALL_MS);
            const chunk = decoder.decode(value, { stream: true });
            suggestion.answer += chunk;

            // Update the suggestion
            publish();
          }
        }

        if (suggestion.state === SuggestionState.Loading) {
          if (suggestion.answer.length === 0) {
            // Indistinguishable from a provider failure, and a stated error beats a card
            // that never resolves.
            suggestion.state = SuggestionState.Error;
            suggestion.error = 'The model returned an empty response.';
          } else {
            suggestion.state = SuggestionState.Success;
          }
          publish();
        }
      } finally {
        // releaseLock alone does not cancel the body. Undici documents that an unconsumed,
        // uncancelled response body leaks the connection and can stall or deadlock later
        // requests, which is the whole reason superseding used to break suggestions.
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    } catch (error) {
      // Keyed on the signal rather than the error name. An abort rejects with the *reason*,
      // so a stall surfaces as TimeoutError and a check for AbortError would miss it and
      // report a deliberate cancellation as a network failure.
      const aborted = controller.signal.aborted;
      const stalled =
        aborted &&
        controller.signal.reason instanceof Error &&
        controller.signal.reason.name === 'TimeoutError';

      if (aborted && !stalled) {
        // Superseded by a newer question. Expected, not a failure.
        suggestion.state = SuggestionState.Stopped;
        // Refresh: a card superseded before it was ever shown has no partial answer on it, and
        // a Stopped ghost appearing for a question the candidate never saw asked reads as a bug.
        refresh();
      } else {
        if (!aborted) {
          console.error('[LiveSuggestionService] Failed to generate suggestion:', error);
        }
        suggestion.state = SuggestionState.Error;
        suggestion.error = stalled
          ? 'The response timed out. Please try again.'
          : getSuggestionErrorMessage(error);
        // Publish: a failure is always worth surfacing, even one that failed fast.
        publish();
      }
    } finally {
      if (stallTimer) clearTimeout(stallTimer);
      if (renderTimer) clearTimeout(renderTimer);
      this.abortMap.delete(taskId);
    }
  }

  async startGenerateSuggestion(
    transcripts: Transcript[],
    turnVerdict: RequestTurnVerdict = RequestTurnVerdict.Uncertain
  ): Promise<void> {
    // Remove trailing SELF transcripts (same logic as Python)
    const filteredTranscripts = [...transcripts];
    while (
      filteredTranscripts.length > 0 &&
      filteredTranscripts[filteredTranscripts.length - 1].speaker === Speaker.Self
    ) {
      filteredTranscripts.pop();
    }

    if (filteredTranscripts.length === 0) {
      return;
    }

    // Cancel current task if running
    this.stopRunningTasks();

    // Start the background task
    const taskId = UuidUtil.generate();
    const controller = new AbortController();
    this.abortMap.set(taskId, controller);

    // generateSuggestion owns the abort-map cleanup in its own finally, but it can throw before
    // reaching the try that guards it - the config and state reads sit above it. Deleting the
    // entry here on a synchronous rejection keeps a dead controller from being aborted forever.
    this.generateSuggestion(taskId, controller, filteredTranscripts, turnVerdict).catch((error) => {
      console.error('[LiveSuggestionService] generateSuggestion rejected:', error);
      this.abortMap.delete(taskId);
    });
  }

  stopRunningTasks(): void {
    // Aborting tears down the HTTP request itself, so a parked reader.read() rejects
    // immediately instead of waiting for a chunk that may never arrive.
    this.abortMap.forEach((controller) => controller.abort());
    this.abortMap.clear();
  }

  async stop(): Promise<void> {
    this.stopRunningTasks();
  }
}

export const liveSuggestionService = new LiveSuggestionService();
