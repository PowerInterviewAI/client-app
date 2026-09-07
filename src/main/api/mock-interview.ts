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

// The probe below is one unauthenticated round-trip against a route that is never going to do
// any work, so it can be far tighter than the calls that generate something.
const MOCK_SUPPORT_PROBE_TIMEOUT_MS = 8_000;

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

  /**
   * Whether the backend this client is pointed at serves the mock-interview routes at all.
   *
   * The client ships on its own schedule from the backend, so a released build can meet a
   * deployment that predates the whole feature. Without this the only way to find that out was
   * to start a session and have the first question fail, which reads as a broken app rather
   * than as a feature that is not there yet.
   *
   * Deliberately a `GET` against a `POST`-only route. A backend that has the route answers `405`
   * without matching a handler, so no auth runs, no rate-limit budget is spent, and no question
   * is generated; one that does not have it answers `404`. Any other status still counts as
   * present - the question being asked is whether the path is routed, and a `401` or a `500`
   * both mean it is.
   *
   * Returns `null`, not `false`, when the request never arrived. An offline laptop must not be
   * recorded as a backend without the feature, because that answer outlives the outage.
   */
  async probeSupport(): Promise<boolean | null> {
    const response = await this.get(
      '/api/mock-interview/question',
      undefined,
      MOCK_SUPPORT_PROBE_TIMEOUT_MS
    );
    if (response.status === 0) return null;
    return response.status !== 404;
  }
}
