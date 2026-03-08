/**
 * Code Suggestion Service
 * Generates code suggestions using LLM based on screenshots and transcripts
 */

import { BrowserWindow, desktopCapturer, screen } from 'electron';
import sharp from 'sharp';

import { ApiClient } from '../api/client.js';
import {
  BACKEND_BASE_URL,
  CODE_SUGGESTION_MAX_SCREENSHOTS,
  SCREENSHOT_TIMEOUT_MS,
} from '../consts.js';
import { CodeSuggestion, RunningState, SuggestionState, Transcript } from '../types/app-state.js';
import { DateTimeUtil } from '../utils/datetime.js';
import { UuidUtil } from '../utils/uuid.js';
import { actionLockService, ActionType } from './action-lock.service.js';
import { appStateService } from './app-state.service.js';
import { pushNotificationService } from './push-notification.service.js';

interface GenerateCodeSuggestionRequest {
  user_prompt?: string;
  image_names: string[];
}

export class CodeSuggestionService {
  private apiClient: ApiClient = new ApiClient();
  private uploadedImageNames: string[] = [];
  private suggestions: Map<number, CodeSuggestion> = new Map();
  private abortMap: Map<string, boolean> = new Map();

  // --------------------------
  // Public API
  // --------------------------

  /**
   * Get all suggestions with pending prompt if images are uploaded
   */
  getSuggestions(isUploading: boolean = false, includePrompt: boolean = true): CodeSuggestion[] {
    let suggestionsArray = Array.from(this.suggestions.values());

    if (!includePrompt) {
      return suggestionsArray;
    }

    if (isUploading) {
      const pendingPrompt: CodeSuggestion = {
        timestamp: DateTimeUtil.now(),
        image_urls: [...this.uploadedImageNames.map((name) => this.getBackendImageUrl(name)), null],
        suggestion_content: '',
        state: SuggestionState.Uploading,
      };
      suggestionsArray = [...suggestionsArray, pendingPrompt];
    } else if (this.uploadedImageNames.length > 0) {
      const pendingPrompt: CodeSuggestion = {
        timestamp: DateTimeUtil.now(),
        image_urls: this.uploadedImageNames.map((name) => this.getBackendImageUrl(name)),
        suggestion_content: '',
        state: SuggestionState.Idle,
      };
      suggestionsArray = [...suggestionsArray, pendingPrompt];
    }

    return suggestionsArray;
  }

  /**
   * Clear uploaded images
   */
  async clearImages(): Promise<void> {
    if (appStateService.getState().runningState !== RunningState.Running) {
      pushNotificationService.pushNotification({
        type: 'warning',
        message: 'Cannot clear images when assistant is not running',
      });
      return;
    }

    this.uploadedImageNames = [];
    appStateService.updateState({ codeSuggestions: this.getSuggestions() });
  }

  /**
   * Capture screenshot and upload to backend
   */
  async captureScreenshot(): Promise<void> {
    if (appStateService.getState().runningState !== RunningState.Running) {
      pushNotificationService.pushNotification({
        type: 'warning',
        message: 'Cannot capture screenshot when assistant is not running',
      });
      return;
    }

    // Enforce maximum screenshots limit
    if (this.uploadedImageNames.length >= CODE_SUGGESTION_MAX_SCREENSHOTS) {
      pushNotificationService.pushNotification({
        type: 'warning',
        message: `Maximum of ${CODE_SUGGESTION_MAX_SCREENSHOTS} screenshots reached. Please clear images and try again.`,
      });
      return;
    }

    // Try to acquire lock
    if (!actionLockService.tryAcquire(ActionType.ScreenshotCapture)) {
      return;
    }

    // Update app state
    appStateService.updateState({
      codeSuggestions: this.getSuggestions(true),
    });

    try {
      // Capture screenshot from main window
      const imageBytes = await this.captureScreenshotAsGrayscale();

      // Create FormData for file upload
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(imageBytes)], { type: 'image/png' });
      formData.append('image_file', blob, 'screenshot.png');

      // Upload image to backend
      const response = await this.apiClient.postFormData<string>('/api/llm/upload-image', formData);
      if (response.error || !response.data) {
        throw new Error(`Upload failed: ${response.error?.message || 'No filename returned'}`);
      }
      this.uploadedImageNames.push(response.data);

      // Update app state
      appStateService.updateState({ codeSuggestions: this.getSuggestions() });
    } catch (error) {
      console.error('[CodeSuggestionService] Failed to capture/upload image:', error);
      // Reset uploading state so UI is not stuck in loading
      appStateService.updateState({ codeSuggestions: this.getSuggestions() });
      pushNotificationService.pushNotification({
        type: 'error',
        message: 'Screenshot capture failed. Please try again.',
      });
    } finally {
      // Release lock — always reached now regardless of capture or upload failure
      actionLockService.release(ActionType.ScreenshotCapture);
    }
  }

  /**
   * Generate code suggestion asynchronously
   */
  async startGenerateSuggestion(transcripts?: Transcript[]): Promise<void> {
    if (appStateService.getState().runningState !== RunningState.Running) {
      pushNotificationService.pushNotification({
        type: 'warning',
        message: 'Cannot generate suggestion when assistant is not running',
      });
      return;
    }

    // Try to acquire lock
    if (!actionLockService.tryAcquire(ActionType.CodeSuggestion)) {
      return;
    }

    // If there are no uploaded images, there is nothing to suggest from
    if (this.uploadedImageNames.length === 0) {
      pushNotificationService.pushNotification({
        type: 'warning',
        message: 'No uploaded images to generate suggestion from',
      });
      // Release lock since we're not generating
      actionLockService.release(ActionType.CodeSuggestion);
      return;
    }

    // Cancel any current task
    this.stopRunningTasks();

    // Start new generation
    const taskId = UuidUtil.generate();
    this.abortMap.set(taskId, false);
    this.generateSuggestion(taskId, transcripts);
  }

  /**
   * Stop current suggestion generation
   */
  stopRunningTasks(): void {
    this.abortMap.forEach((_value, key) => {
      this.abortMap.set(key, true);
    });
  }

  // --------------------------
  // Private Methods
  // --------------------------

  /**
   * Build user prompt from transcripts
   */
  private buildUserPrompt(transcripts?: Transcript[]): string | undefined {
    if (!transcripts || transcripts.length === 0) {
      return undefined;
    }

    const parts = transcripts.map(
      (t) => `[${new Date(t.timestamp).toLocaleString()}] ${t.speaker}: ${t.text}`
    );
    return parts.join('\n');
  }

  private setSuggestion(timestamp: number, suggestion: CodeSuggestion): void {
    this.suggestions.set(timestamp, suggestion);
    appStateService.updateState({ codeSuggestions: this.getSuggestions(false, false) });
  }

  /**
   * Generate code suggestion and stream response
   */
  private async generateSuggestion(taskId: string, transcripts?: Transcript[]): Promise<void> {
    const timestamp = DateTimeUtil.now();
    const userPrompt = this.buildUserPrompt(transcripts);

    const payload: GenerateCodeSuggestionRequest = {
      user_prompt: userPrompt,
      image_names: [...this.uploadedImageNames],
    };

    // Create initial suggestion
    const suggestion: CodeSuggestion = {
      timestamp,
      image_urls: this.uploadedImageNames.map((name) => this.getBackendImageUrl(name)),
      suggestion_content: '',
      state: SuggestionState.Pending,
    };
    this.setSuggestion(timestamp, suggestion);

    // Clear uploaded images (they're now part of the request)
    this.uploadedImageNames = [];

    try {
      const stream = await this.apiClient.postStream('api/llm/code-suggestion', payload);
      if (!stream) {
        throw new Error('Failed to get stream response');
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      // Update state to loading
      suggestion.state = SuggestionState.Loading;
      this.setSuggestion(timestamp, suggestion);

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          // Check if task was stopped
          if (this.abortMap.get(taskId)) {
            this.abortMap.delete(taskId);

            console.info('[CodeSuggestionService] Code suggestion generation stopped by user');
            suggestion.state = SuggestionState.Stopped;
            this.setSuggestion(timestamp, suggestion);
            return;
          }

          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            suggestion.suggestion_content += chunk;
            suggestion.state = SuggestionState.Loading;
            this.setSuggestion(timestamp, suggestion);
          }
        }

        // Mark as successful if not stopped
        if (suggestion.state === SuggestionState.Loading) {
          suggestion.state = SuggestionState.Success;
          this.setSuggestion(timestamp, suggestion);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('[CodeSuggestionService] Failed to generate code suggestion:', error);
      suggestion.state = SuggestionState.Error;
      this.setSuggestion(timestamp, suggestion);
    } finally {
      // Release lock when generation completes
      actionLockService.release(ActionType.CodeSuggestion);
    }
  }

  /**
   * Get backend image URL
   */
  private getBackendImageUrl(imageName: string): string {
    return `${BACKEND_BASE_URL}/api/llm/get-thumb/${imageName}`;
  }

  /**
   * Capture screenshot from desktop and convert to grayscale PNG
   */
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

      console.log(
        `[CodeSuggestionService] Capturing display id=${targetDisplay.id} (${physicalWidth}x${physicalHeight})...`
      );

      // desktopCapturer is Electron's built-in screen-capture API.
      // A timeout guards against indefinite hangs on restricted or virtual display adapters.
      const sources = await Promise.race([
        desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: physicalWidth, height: physicalHeight },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Screenshot timed out after ${SCREENSHOT_TIMEOUT_MS}ms`)),
            SCREENSHOT_TIMEOUT_MS
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

      console.log(`[CodeSuggestionService] Using source: "${targetSource.name}"`);

      const capturedBuffer: Buffer = targetSource.thumbnail.toPNG();
      console.log(`[CodeSuggestionService] Captured ${capturedBuffer.length} bytes`);

      // Use Sharp to convert to grayscale PNG with high efficiency
      const grayscalePngBuffer = await sharp(capturedBuffer)
        .greyscale()
        .png({
          compressionLevel: 6,
          quality: 85,
        })
        .toBuffer();

      console.log(
        `[CodeSuggestionService] Converted to grayscale: ${grayscalePngBuffer.length} bytes`
      );

      return new Uint8Array(grayscalePngBuffer);
    } catch (error) {
      console.error('[CodeSuggestionService] Failed to capture screenshot:', error);
      throw new Error(
        `Screenshot capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clear suggestions (legacy method)
   */
  async clear(): Promise<void> {
    this.stopRunningTasks();
    this.suggestions.clear();
    this.uploadedImageNames = [];
    // Update app state
    appStateService.updateState({ codeSuggestions: [] });
  }

  async stop(): Promise<void> {
    this.stopRunningTasks();
  }
}

export const codeSuggestionService = new CodeSuggestionService();
