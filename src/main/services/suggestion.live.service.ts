/**
 * Suggestion Service
 * Generates natural language suggestions for interviews
 *
 * Based on the Python equivalent with threading and streaming support
 */

import { LLMApi } from '../api/llm.js';
import { ApiRequestError } from '../api/client.js';
import { LIVE_SUGGESTION_NO_SUGGESTION } from '../consts.js';
import { configStore } from '../store/config.store.js';
import { LiveSuggestion, Speaker, SuggestionState, Transcript } from '../types/app-state.js';
import { GenerateLiveSuggestionRequest } from '../types/llm.js';
import { DateTimeUtil } from '../utils/datetime.js';
import { UuidUtil } from '../utils/uuid.js';
import { appStateService } from './app-state.service.js';

class LiveSuggestionService {
  private llmApi: LLMApi = new LLMApi();
  private suggestions: Map<number, LiveSuggestion> = new Map();
  private abortMap: Map<string, boolean> = new Map();

  /**
   * Clear all suggestions and stop current task
   */
  async clear(): Promise<void> {
    this.stopRunningTasks();
    this.suggestions.clear();
    // Update app state
    appStateService.updateState({ liveSuggestions: [] });
  }

  private apendSuggestion(timestamp: number, suggestion: LiveSuggestion): void {
    if (
      suggestion.answer.length > 0 &&
      LIVE_SUGGESTION_NO_SUGGESTION.startsWith(suggestion.answer)
    ) {
      this.suggestions.delete(timestamp);
    } else {
      this.suggestions.set(timestamp, suggestion);
    }
    appStateService.updateState({
      liveSuggestions: Array.from(this.suggestions.values()),
    });
  }

  /**
   * Generate suggestion synchronously (main worker method)
   */
  private async generateSuggestion(taskId: string, transcripts: Transcript[]): Promise<void> {
    if (!transcripts || transcripts.length === 0) {
      return;
    }

    const timestamp = DateTimeUtil.now();
    const suggestion: LiveSuggestion = {
      timestamp,
      last_question: transcripts[transcripts.length - 1].text,
      answer: '',
      state: SuggestionState.Pending,
      error: '',
    };

    // Append initial suggestion
    this.apendSuggestion(timestamp, suggestion);

    try {
      const conf = configStore.getConfig();
      const requestBody: GenerateLiveSuggestionRequest = {
        config: conf.llmConf,
        profile_data: conf.interviewConf.profileData,
        context: conf.interviewConf.jobDescription,
        transcripts: transcripts,
      };

      const response = await this.llmApi.generateLiveSuggestions(requestBody);
      if (!response) {
        throw new Error('No response from suggestion API');
      }

      const reader = response.getReader();
      const decoder = new TextDecoder('utf-8');
      try {
        while (true) {
          // Check if stopped
          if (this.abortMap.get(taskId)) {
            this.abortMap.delete(taskId);

            console.log('Suggestion generation aborted by user request');
            suggestion.state = SuggestionState.Stopped;
            this.apendSuggestion(timestamp, suggestion);
            return;
          }

          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            suggestion.answer += chunk;
            suggestion.state = SuggestionState.Loading;

            // Update the suggestion
            this.apendSuggestion(timestamp, suggestion);
          }
        }

        // Mark as successful if not stopped
        if (suggestion.state === SuggestionState.Loading) {
          suggestion.state = SuggestionState.Success;
          this.apendSuggestion(timestamp, suggestion);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Failed to generate suggestion', error);
      suggestion.state = SuggestionState.Error;
      suggestion.error = this.getSuggestionErrorMessage(error);

      this.apendSuggestion(timestamp, suggestion);
    }
  }

  private getSuggestionErrorMessage(error: unknown): string {
    if (error instanceof ApiRequestError) {
      const content =
        typeof error.content === 'string' && error.content.length > 0
          ? error.content
          : JSON.stringify(error.content ?? {});
      return `status=${error.status}; content=${content}`;
    }
    return error instanceof Error ? error.message : String(error);
  }

  /**
   * Generate suggestion asynchronously (spawn background task)
   */
  async startGenerateSuggestion(transcripts: Transcript[]): Promise<void> {
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
    this.abortMap.set(taskId, false);
    this.generateSuggestion(taskId, filteredTranscripts);
  }

  /**
   * Stop current task safely
   */
  stopRunningTasks(): void {
    this.abortMap.forEach((_value, key) => {
      this.abortMap.set(key, true);
    });
  }

  async stop(): Promise<void> {
    this.stopRunningTasks();
  }
}

export const liveSuggestionService = new LiveSuggestionService();
