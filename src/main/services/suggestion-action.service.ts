import { BrowserWindow, desktopCapturer, screen } from 'electron';
import sharp from 'sharp';

import { LLMApi } from '../api/llm.js';
import {
  ACTION_SUGGESTION_MAX_CAPTURES,
  ACTION_SUGGESTION_TTFB_MS,
  ACTION_TIMEOUT_MS,
  BACKEND_BASE_URL,
  CAPTURE_MAX_EDGE_PX,
  SUGGESTION_STALL_MS,
  TRANSCRIPT_UPLOAD_LIMIT,
} from '../consts.js';
import { configStore } from '../store/config.store.js';
import {
  ActionSuggestion,
  RunningState,
  Speaker,
  SuggestionState,
  Transcript,
} from '../types/app-state.js';
import { GenerateActionSuggestionRequest, SuggestionMode } from '../types/llm.js';
import { isMockInterviewSessionActive } from '../types/mock-interview.js';
import { DateTimeUtil } from '../utils/datetime.js';
import { getSuggestionErrorMessage } from '../utils/suggestion-error.js';
import { UuidUtil } from '../utils/uuid.js';
import { actionLockService, ActionType } from './action-lock.service.js';
import { appStateService } from './app-state.service.js';
import { pushNotificationService } from './push-notification.service.js';

export class ActionSuggestionService {
  private llmApi: LLMApi = new LLMApi();
  private uploadedImageNames: string[] = [];
  private suggestions: Map<number, ActionSuggestion> = new Map();
  private abortMap: Map<string, AbortController> = new Map();

  hasUploadedImages(): boolean {
    return this.uploadedImageNames.length > 0;
  }

  /**
   * Refuse action suggestions during a mock interview, with its own message.
   *
   * This block is already true today as a side effect of mock mode never setting
   * `RunningState.Running` - the three callers below all gate on that first. That is emergent,
   * not designed: the day mock interview reuses `RunningState` for its own surface-hiding
   * purposes (a genuinely tempting refactor), the four global hotkeys that reach these methods
   * go live during practice with nothing failing anywhere. This explicit check is what survives
   * that change; it is a belt to the `RunningState` brace, not a replacement for it.
   */
  private refuseDuringMockInterview(message: string): boolean {
    if (!isMockInterviewSessionActive(appStateService.getState().mockInterview)) return false;
    pushNotificationService.pushNotification({ type: 'warning', message });
    return true;
  }

  getSuggestions(isUploading: boolean = false, includePrompt: boolean = true): ActionSuggestion[] {
    let suggestionsArray = Array.from(this.suggestions.values());

    if (!includePrompt) {
      return suggestionsArray;
    }

    const appState = appStateService.getState();
    const lastQuestion = this.getLastInterviewerQuestion(appState.transcripts);

    if (isUploading) {
      const pendingPrompt: ActionSuggestion = {
        timestamp: DateTimeUtil.now(),
        last_question: lastQuestion,
        answer: '',
        image_urls: [...this.uploadedImageNames.map((name) => this.getBackendImageUrl(name)), null],
        state: SuggestionState.Uploading,
        error: '',
      };
      suggestionsArray = [...suggestionsArray, pendingPrompt];
    } else if (this.uploadedImageNames.length > 0) {
      const pendingPrompt: ActionSuggestion = {
        timestamp: DateTimeUtil.now(),
        last_question: lastQuestion,
        answer: '',
        image_urls: this.uploadedImageNames.map((name) => this.getBackendImageUrl(name)),
        state: SuggestionState.Idle,
        error: '',
      };
      suggestionsArray = [...suggestionsArray, pendingPrompt];
    }

    return suggestionsArray;
  }

  async clearImages(): Promise<void> {
    if (
      this.refuseDuringMockInterview('Action suggestions are unavailable during a mock interview.')
    ) {
      return;
    }
    if (appStateService.getState().runningState !== RunningState.Running) {
      pushNotificationService.pushNotification({
        type: 'warning',
        message: 'Cannot clear images when assistant is not running',
      });
      return;
    }

    this.uploadedImageNames = [];
    appStateService.updateState({ actionSuggestions: this.getSuggestions() });
  }

  async captureScreenshot(): Promise<void> {
    if (
      this.refuseDuringMockInterview('Action suggestions are unavailable during a mock interview.')
    ) {
      return;
    }
    if (appStateService.getState().runningState !== RunningState.Running) {
      pushNotificationService.pushNotification({
        type: 'warning',
        message: 'Cannot capture screenshot when assistant is not running',
      });
      return;
    }

    if (this.uploadedImageNames.length >= ACTION_SUGGESTION_MAX_CAPTURES) {
      pushNotificationService.pushNotification({
        type: 'warning',
        message: `Maximum of ${ACTION_SUGGESTION_MAX_CAPTURES} screenshots reached. Please clear images and try again.`,
      });
      return;
    }

    if (!actionLockService.tryAcquire(ActionType.ScreenshotCapture)) {
      return;
    }

    appStateService.updateState({
      actionSuggestions: this.getSuggestions(true),
    });

    try {
      const imageBytes = await this.captureScreenshotAsGrayscale();

      const formData = new FormData();
      const blob = new Blob([new Uint8Array(imageBytes)], { type: 'image/png' });
      formData.append('image_file', blob, 'screenshot.png');

      const response = await this.llmApi.uploadImage(formData);
      if (response.error || !response.data) {
        throw new Error(`Upload failed: ${response.error?.message || 'No filename returned'}`);
      }
      this.uploadedImageNames.push(response.data);

      appStateService.updateState({ actionSuggestions: this.getSuggestions() });
    } catch (error) {
      console.error('[ActionSuggestionService] Failed to capture/upload image:', error);
      appStateService.updateState({ actionSuggestions: this.getSuggestions() });
      pushNotificationService.pushNotification({
        type: 'error',
        message: 'Screenshot capture failed. Please try again.',
      });
    } finally {
      actionLockService.release(ActionType.ScreenshotCapture);
    }
  }

  async startGenerateSuggestion(): Promise<void> {
    if (
      this.refuseDuringMockInterview('Action suggestions are unavailable during a mock interview.')
    ) {
      return;
    }

    const appState = appStateService.getState();

    if (appState.runningState !== RunningState.Running) {
      pushNotificationService.pushNotification({
        type: 'warning',
        message: 'Cannot generate suggestion when assistant is not running',
      });
      return;
    }

    if (!actionLockService.tryAcquire(ActionType.CaptureSuggestion)) {
      return;
    }

    this.stopRunningTasks();

    const taskId = UuidUtil.generate();
    const controller = new AbortController();
    this.abortMap.set(taskId, controller);

    // generateSuggestion owns the release, but it can throw before reaching its own try/finally
    // (config reads, state reads, the first setSuggestion). Releasing here on a synchronous
    // rejection keeps a leaked lock from disabling all three action hotkeys for the session.
    this.generateSuggestion(taskId, controller, appState.transcripts).catch((error) => {
      console.error('[ActionSuggestionService] generateSuggestion rejected:', error);
      actionLockService.release(ActionType.CaptureSuggestion);
    });
  }

  stopRunningTasks(): void {
    this.abortMap.forEach((controller) => controller.abort());
    this.abortMap.clear();
  }

  async clear(): Promise<void> {
    this.stopRunningTasks();
    this.suggestions.clear();
    this.uploadedImageNames = [];
    appStateService.updateState({ actionSuggestions: [] });
  }

  async stop(): Promise<void> {
    this.stopRunningTasks();
  }

  private setSuggestion(timestamp: number, suggestion: ActionSuggestion): void {
    this.suggestions.set(timestamp, suggestion);
    appStateService.updateState({ actionSuggestions: this.getSuggestions(false, false) });
  }

  // Returns the most recent finalized transcript spoken by the interviewer (ch_0 / Other speaker)
  private getLastInterviewerQuestion(transcripts: Transcript[]): string {
    for (let i = transcripts.length - 1; i >= 0; i--) {
      const t = transcripts[i];
      if (t.speaker === Speaker.Other && t.isFinal) {
        return t.text;
      }
    }
    return '';
  }

  private async generateSuggestion(
    taskId: string,
    controller: AbortController,
    transcripts: Transcript[]
  ): Promise<void> {
    // The controller is passed in rather than looked up. A lookup needs a not-found branch,
    // and that branch would return before reaching the finally that releases the action lock -
    // leaking it permanently and disabling all three hotkeys, which is the exact bug this
    // service is being fixed for.
    const timestamp = DateTimeUtil.now();
    const conf = configStore.getConfig();
    const interviewConfig = appStateService.getState().interviewConfig;

    const payload: GenerateActionSuggestionRequest = {
      profile_data: interviewConfig.profileData,
      context: interviewConfig.context,
      transcripts: transcripts.slice(-TRANSCRIPT_UPLOAD_LIMIT),
      image_names: [...this.uploadedImageNames],
      mode: conf.hintOnlyMode ? SuggestionMode.HintOnly : SuggestionMode.FullSentence,
      language: conf.language,
    };

    const lastQuestion = this.getLastInterviewerQuestion(transcripts);

    const suggestion: ActionSuggestion = {
      timestamp,
      last_question: lastQuestion,
      answer: '',
      image_urls: this.uploadedImageNames.map((name) => this.getBackendImageUrl(name)),
      state: SuggestionState.Pending,
      error: '',
    };
    this.setSuggestion(timestamp, suggestion);

    this.uploadedImageNames = [];

    // See the live-suggestion service: a resettable timer, not a race against reader.read().
    let stallTimer: NodeJS.Timeout | null = null;
    const armStallTimer = (ms: number): void => {
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        controller.abort(new DOMException('stalled', 'TimeoutError'));
      }, ms);
    };

    try {
      // Action requests carry up to four screenshots that the backend base64-encodes before
      // the provider emits a token, so they legitimately start much slower than live ones.
      armStallTimer(ACTION_SUGGESTION_TTFB_MS);
      const stream = await this.llmApi.generateActionSuggestionStream(payload, controller.signal);
      if (!stream) {
        throw new Error('Failed to get stream response');
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      suggestion.state = SuggestionState.Loading;
      this.setSuggestion(timestamp, suggestion);

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          if (value) {
            armStallTimer(SUGGESTION_STALL_MS);
            const chunk = decoder.decode(value, { stream: true });
            suggestion.answer += chunk;
            this.setSuggestion(timestamp, suggestion);
          }
        }

        if (suggestion.state === SuggestionState.Loading) {
          if (suggestion.answer.length === 0) {
            // This path already promoted to Loading before the loop, so an empty stream lands
            // here as a blank Success card rather than a stuck one. Still wrong: report it.
            suggestion.state = SuggestionState.Error;
            suggestion.error = 'The model returned an empty response.';
          } else {
            suggestion.state = SuggestionState.Success;
          }
          this.setSuggestion(timestamp, suggestion);
        }
      } finally {
        // releaseLock does not cancel the body; an abandoned body leaks the connection.
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    } catch (error) {
      // See the live-suggestion service: an abort rejects with the reason, so the signal is
      // the reliable source, not the error name.
      const aborted = controller.signal.aborted;
      const stalled =
        aborted &&
        controller.signal.reason instanceof Error &&
        controller.signal.reason.name === 'TimeoutError';

      if (aborted && !stalled) {
        console.info('[ActionSuggestionService] Action suggestion generation stopped');
        suggestion.state = SuggestionState.Stopped;
      } else {
        if (!aborted) {
          console.error('[ActionSuggestionService] Failed to generate action suggestion:', error);
        }
        suggestion.state = SuggestionState.Error;
        suggestion.error = stalled
          ? 'The response timed out. Please try again.'
          : getSuggestionErrorMessage(error);
      }
      this.setSuggestion(timestamp, suggestion);
    } finally {
      if (stallTimer) clearTimeout(stallTimer);
      this.abortMap.delete(taskId);
      actionLockService.release(ActionType.CaptureSuggestion);
    }
  }

  private getBackendImageUrl(imageName: string): string {
    return `${BACKEND_BASE_URL}/api/llm/get-thumb/${imageName}`;
  }

  private async captureScreenshotAsGrayscale(): Promise<Uint8Array> {
    try {
      // Identify which display the main window is currently on, so we only
      // capture that screen rather than all displays.
      const win = BrowserWindow.getAllWindows()[0];
      const targetDisplay = win
        ? screen.getDisplayMatching(win.getBounds())
        : screen.getPrimaryDisplay();

      const physicalWidth = Math.round(targetDisplay.size.width * targetDisplay.scaleFactor);
      const physicalHeight = Math.round(targetDisplay.size.height * targetDisplay.scaleFactor);

      // Scale at capture time rather than after. thumbnail.toPNG() below is synchronous and
      // runs on the main process, so shrinking the bitmap first is what keeps it from stalling
      // the event loop; doing it in sharp afterwards would be too late.
      const scale = Math.min(1, CAPTURE_MAX_EDGE_PX / Math.max(physicalWidth, physicalHeight));
      const captureWidth = Math.round(physicalWidth * scale);
      const captureHeight = Math.round(physicalHeight * scale);

      // desktopCapturer is Electron's built-in screen-capture API.
      // A timeout guards against indefinite hangs on restricted or virtual display adapters.
      const sources = await Promise.race([
        desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: captureWidth, height: captureHeight },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Screenshot timed out after ${ACTION_TIMEOUT_MS}ms`)),
            ACTION_TIMEOUT_MS
          )
        ),
      ]);

      if (!sources || sources.length === 0) {
        throw new Error('No screen sources captured from any display');
      }

      // Match the source to the target display using display_id.
      // Fall back to the first source if no match (e.g. on Linux where display_id may be empty).
      const targetSource =
        sources.find((s) => s.display_id === String(targetDisplay.id)) ?? sources[0];

      const capturedBuffer: Buffer = targetSource.thumbnail.toPNG();

      const grayscalePngBuffer = await sharp(capturedBuffer)
        .greyscale()
        .png({
          compressionLevel: 6,
          quality: 85,
        })
        .toBuffer();

      return new Uint8Array(grayscalePngBuffer);
    } catch (error) {
      console.error('[ActionSuggestionService] Failed to capture screenshot:', error);
      throw new Error(
        `Screenshot capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export const actionSuggestionService = new ActionSuggestionService();
