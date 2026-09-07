/**
 * Mock Interview API
 * Handles calls to the backend's /api/mock-interview/* endpoints
 */

import {
  EvaluateMockTurnRequest,
  GenerateMockQuestionRequest,
  GenerateMockReportRequest,
  MockQuestion,
  MockReport,
  MockTurnDecision,
  SpeakRequest,
} from '../types/mock-interview.js';
import { ApiClient, ApiResponse } from './client.js';

// Time to first byte. Generous relative to a live suggestion because this is a single
// non-streaming JSON reply rather than the first chunk of a stream.
const MOCK_QUESTION_TIMEOUT_MS = 30_000;
const MOCK_TURN_TIMEOUT_MS = 15_000;
const MOCK_REPORT_TIMEOUT_MS = 60_000;
const MOCK_SPEAK_TIMEOUT_MS = 20_000;

export class MockInterviewApi extends ApiClient {
  async generateQuestion(data: GenerateMockQuestionRequest): Promise<ApiResponse<MockQuestion>> {
    return this.post<MockQuestion>('/api/mock-interview/question', data, MOCK_QUESTION_TIMEOUT_MS);
  }

  async evaluateTurn(data: EvaluateMockTurnRequest): Promise<ApiResponse<MockTurnDecision>> {
    return this.post<MockTurnDecision>('/api/mock-interview/turn', data, MOCK_TURN_TIMEOUT_MS);
  }

  async generateReport(data: GenerateMockReportRequest): Promise<ApiResponse<MockReport>> {
    return this.post<MockReport>('/api/mock-interview/report', data, MOCK_REPORT_TIMEOUT_MS);
  }

  /**
   * Synthesize speech for one question chunk.
   *
   * Resolves to `null` for a language with no Aura voice (a `204`, not an error) - the caller
   * falls back to text-only for that question rather than treating it as a failure.
   */
  async speak(data: SpeakRequest): Promise<ArrayBuffer | null> {
    return this.postArrayBuffer('/api/mock-interview/speak', data, MOCK_SPEAK_TIMEOUT_MS);
  }
}
