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
const MOCK_SPEAK_TIMEOUT_MS = 20_000;

// The report is the one call whose duration scales with the session, so it is the one call a
// single number cannot cover. `MockReport` carries a score, a justification *and* a full rewritten
// answer for every question, so a twelve-turn session asks for several times the generation a
// three-turn one does - and the flat 60s this replaced was calibrated to neither. Long sessions
// hit it routinely, which is what "scoring sometimes times out" was: an abort on the client while
// the backend went on to finish the report and charge for it.
//
// Wall clock rather than a stall timer, unlike the streaming paths. The reply is one JSON body, so
// nothing arrives until the whole thing is generated and there is no progress to detect - the
// ceiling is what keeps the deadline honest, and End stays live for the whole of `Scoring` as the
// manual way out of a request that really has hung.
const MOCK_REPORT_BASE_MS = 45_000;
const MOCK_REPORT_PER_QUESTION_MS = 20_000;
const MOCK_REPORT_MAX_MS = 240_000;

export function mockReportTimeoutMs(questionCount: number): number {
  const questions = Number.isFinite(questionCount) ? Math.max(0, questionCount) : 0;
  return Math.min(MOCK_REPORT_MAX_MS, MOCK_REPORT_BASE_MS + questions * MOCK_REPORT_PER_QUESTION_MS);
}

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

  /**
   * Scored off the turns actually being sent rather than the session's configured length, so a
   * session that ended early is not held to a deadline for questions it never asked and one that
   * ran long on follow-ups gets the time they cost.
   */
  async generateReport(data: GenerateMockReportRequest): Promise<ApiResponse<MockReport>> {
    return this.post<MockReport>(
      '/api/mock-interview/report',
      data,
      mockReportTimeoutMs(data.questions.length)
    );
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
