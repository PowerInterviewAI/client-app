import { BrowserWindow, desktopCapturer, screen } from 'electron';
import sharp from 'sharp';

import { LLMApi } from '../api/llm.js';
import { ACTION_SUGGESTION_MAX_CAPTURES, ACTION_TIMEOUT_MS, BACKEND_BASE_URL } from '../consts.js';
import { configStore } from '../store/config.store.js';
import {
  ActionSuggestion,
  RunningState,
  Speaker,
  SuggestionState,
  Transcript,
} from '../types/app-state.js';
import { GenerateActionSuggestionRequest } from '../types/llm.js';
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
  private abortMap: Map<string, boolean> = new Map();

  hasUploadedImages(): boolean {
    return this.uploadedImageNames.length > 0;
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
    this.abortMap.set(taskId, false);
    this.generateSuggestion(taskId, appState.transcripts);
  }

  stopRunningTasks(): void {
    this.abortMap.forEach((_value, key) => {
      this.abortMap.set(key, true);
    });
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

  private async generateSuggestion(taskId: string, transcripts: Transcript[]): Promise<void> {
    const timestamp = DateTimeUtil.now();
    const conf = configStore.getConfig();

    const payload: GenerateActionSuggestionRequest = {
      config: conf.llmConf,
      profile_data: conf.interviewConf.profileData,
      context: conf.interviewConf.context,
      transcripts: transcripts,
      image_names: [...this.uploadedImageNames],
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

    try {
      const stream = await this.llmApi.generateActionSuggestionStream(payload);
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

          if (this.abortMap.get(taskId)) {
            this.abortMap.delete(taskId);

            console.info('[ActionSuggestionService] Action suggestion generation stopped by user');
            suggestion.state = SuggestionState.Stopped;
            this.setSuggestion(timestamp, suggestion);
            return;
          }

          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            suggestion.answer += chunk;
            suggestion.state = SuggestionState.Loading;
            this.setSuggestion(timestamp, suggestion);
          }
        }

        if (suggestion.state === SuggestionState.Loading) {
          suggestion.state = SuggestionState.Success;
          this.setSuggestion(timestamp, suggestion);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('[ActionSuggestionService] Failed to generate action suggestion:', error);
      suggestion.state = SuggestionState.Error;
      suggestion.error = getSuggestionErrorMessage(error);
      this.setSuggestion(timestamp, suggestion);
    } finally {
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

      // desktopCapturer is Electron's built-in screen-capture API.
      // A timeout guards against indefinite hangs on restricted or virtual display adapters.
      const sources = await Promise.race([
        desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: physicalWidth, height: physicalHeight },
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
