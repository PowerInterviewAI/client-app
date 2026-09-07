/**
 * LLM API
 * Handles LLM operations
 */

import {
  GenerateActionSuggestionRequest,
  GenerateLiveSuggestionRequest,
  GenerateSummarizeRequest,
} from '../types/llm.js';
import { ApiClient, ApiResponse } from './client.js';

export class LLMApi extends ApiClient {
  /**
   * Generate Live Suggestions
   */
  async generateLiveSuggestions(
    data: GenerateLiveSuggestionRequest,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array> | null> {
    return this.postStream('/api/llm/live-suggestion', data, signal);
  }

  /**
   * Upload Image
   */
  async uploadImage(data: FormData): Promise<ApiResponse<string>> {
    return this.postFormData<string>('/api/llm/upload-image', data);
  }

  /**
   * Generate Action Suggestion
   */
  async generateActionSuggestionStream(
    payload: GenerateActionSuggestionRequest,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array> | null> {
    return this.postStream('api/llm/action-suggestion', payload, signal);
  }

  /**
   * Generate Summary
   */
  async generateSummary(request: GenerateSummarizeRequest): Promise<ApiResponse<string>> {
    return this.post<string>('/api/llm/summarize', request);
  }
}
