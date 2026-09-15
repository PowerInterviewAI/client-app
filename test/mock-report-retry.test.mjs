/**
 * The report call's deadline, and the recovery when it is still not enough.
 *
 * Scoring is the one charged call in a mock interview whose duration scales with the session -
 * `MockReport` carries a score, a justification and a full rewritten answer per question - and it
 * used to run against a flat 60s wall clock. Long sessions hit that routinely, which is what
 * "scoring sometimes times out" was, and the failure was terminal: the answers stayed on screen
 * and stayed exportable, but the score they had already been billed for could not be obtained by
 * any route short of running a second interview.
 *
 * Same fake-fetch harness as `mock-interview-state.test.mjs`, against the same service singleton.
 */
import { createChecker, loadMain } from './helpers.mjs';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const REPORT = {
  overall_score: 74,
  strengths: ['clear'],
  gaps: ['depth'],
  questions: [],
};

export async function run() {
  const { check, failures } = createChecker('mock-report-retry');

  const { mockReportTimeoutMs } = await loadMain('api/mock-interview.js');
  const { mockInterviewService } = await loadMain('services/mock-interview.service.js');
  const { MockInterviewState } = await loadMain('types/mock-interview.js');

  // The deadline scales with the turns actually being scored, so one number no longer has to be
  // right for a three-question session and a twelve-question one at once.
  check('a short session gets more than the flat 60s it used to', mockReportTimeoutMs(1) > 60_000);
  check(
    'and a longer one gets more than a shorter one',
    mockReportTimeoutMs(8) > mockReportTimeoutMs(3)
  );
  check(
    'the session length that used to fail now clears a minute comfortably',
    mockReportTimeoutMs(10) >= 180_000
  );
  // Bounded at both ends: a zero-turn call still gets a real deadline, and a hung request cannot
  // hold the Scoring spinner indefinitely just because the session was long.
  check('a zero-question call still carries a deadline', mockReportTimeoutMs(0) >= 30_000);
  check('and the ceiling holds', mockReportTimeoutMs(500) === mockReportTimeoutMs(1000));
  check('with a ceiling End is still a usable way out of', mockReportTimeoutMs(500) <= 300_000);

  const originalFetch = globalThis.fetch;
  const state = { reportShouldFail: true, holdReport: null };
  let reportCalls = 0;

  globalThis.fetch = async (url) => {
    const path = String(url);
    if (path.includes('/mock-interview/question')) {
      return jsonResponse({ text: 'A question', kind: 'technical' });
    }
    if (path.includes('/mock-interview/turn')) {
      return jsonResponse({ action: 'next', follow_up_question: '' });
    }
    if (path.includes('/mock-interview/report')) {
      reportCalls += 1;
      if (state.holdReport) await state.holdReport;
      if (state.reportShouldFail) return jsonResponse({ detail: 'error' }, 500);
      return jsonResponse(REPORT);
    }
    return new Response(null, { status: 404 });
  };

  const setup = {
    role: 'Backend Engineer',
    seniority: 'mid',
    difficulty: 'standard',
    question_count: 1,
  };

  const answerOneQuestion = async () => {
    await mockInterviewService.start(setup);
    await mockInterviewService.speechFinished();
    mockInterviewService.ingestAnswer('final', 'A real answer.');
    await mockInterviewService.answerFinished();
  };

  let release = () => {};
  const holdNextReport = () => {
    state.holdReport = new Promise((resolve) => {
      release = resolve;
    });
  };
  const releaseReport = async (pending) => {
    release();
    state.holdReport = null;
    await pending;
  };

  try {
    // Reach Finished with a failed report, the shape a timeout leaves behind.
    mockInterviewService.clear();
    await answerOneQuestion();
    check(
      'a failed report reaches Finished',
      mockInterviewService.getState().state === MockInterviewState.Finished
    );
    check('with an error', mockInterviewService.getState().reportError !== null);
    check('and nothing in flight', mockInterviewService.getState().rescoring === false);

    // The retry is held open so the in-flight shape can be read. It must stay on `Finished`:
    // `Scoring` is an active session, which would re-arm the navigation lock and replace the
    // report screen the candidate is looking at with the session screen.
    holdNextReport();
    state.reportShouldFail = false;
    const retry = mockInterviewService.retryScoring();
    await Promise.resolve();
    check('a retry in flight sets rescoring', mockInterviewService.getState().rescoring === true);
    check(
      'and stays on Finished rather than re-entering Scoring',
      mockInterviewService.getState().state === MockInterviewState.Finished
    );
    check('with the answers still on screen', mockInterviewService.getState().answers.length === 1);
    await releaseReport(retry);

    check(
      'a successful retry produces the report',
      mockInterviewService.getState().report !== null
    );
    check('clears the error', mockInterviewService.getState().reportError === null);
    check('and clears rescoring', mockInterviewService.getState().rescoring === false);
    check(
      'and is still Finished',
      mockInterviewService.getState().state === MockInterviewState.Finished
    );

    // Nothing left to recover, so nothing to charge for: a retry against a report that already
    // exists must not reach the backend at all.
    const afterSuccess = reportCalls;
    await mockInterviewService.retryScoring();
    check('a retry with no error on the session is a no-op', reportCalls === afterSuccess);

    // A failed retry lands back where the first failure did rather than stranding the session,
    // and can be asked for again.
    state.reportShouldFail = true;
    mockInterviewService.clear();
    await answerOneQuestion();
    const beforeFailedRetry = reportCalls;
    await mockInterviewService.retryScoring();
    check('a failed retry does reach the backend', reportCalls === beforeFailedRetry + 1);
    check(
      'and leaves the session on Finished with an error, not rescoring',
      mockInterviewService.getState().state === MockInterviewState.Finished &&
        mockInterviewService.getState().reportError !== null &&
        mockInterviewService.getState().rescoring === false
    );

    // `clear()` bumps the session sequence, so a retry the candidate has already navigated past
    // cannot write its result onto the session that replaced it.
    holdNextReport();
    state.reportShouldFail = false;
    const abandoned = mockInterviewService.retryScoring();
    await Promise.resolve();
    mockInterviewService.clear();
    await releaseReport(abandoned);
    check(
      'a retry abandoned by clear() writes nothing back',
      mockInterviewService.getState().state === MockInterviewState.Idle &&
        mockInterviewService.getState().report === null
    );
  } finally {
    globalThis.fetch = originalFetch;
    mockInterviewService.clear();
  }

  return failures;
}
