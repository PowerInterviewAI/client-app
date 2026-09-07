/**
 * The mock interview's terminal-state invariant, the same one `use-assistant-service.ts`
 * documents for `RunningState`: whatever fails on the way, the state always lands on `Idle` or
 * `Finished`, and no control is left permanently disabled.
 *
 * `mockInterviewService` builds its own `MockInterviewApi`, so these drive it through a fake
 * `globalThis.fetch` rather than mocking the class - every failure mode below is a real HTTP
 * response shape (a 500, or a payload the schema would reject), not a stubbed method throwing on
 * command.
 *
 * English always has an Aura voice, so every question this file generates enters `Speaking`
 * before `Listening` - `toListening()` stands in for the renderer's `speechFinished()` report
 * once TTS playback ends, and is a harmless no-op if the state already reached `Listening` on its
 * own (the text-only path, not exercised here).
 */
import { createChecker, loadMain } from './helpers.mjs';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function run() {
  const { check, failures } = createChecker('mock-interview-state');

  const { mockInterviewService } = await loadMain('services/mock-interview.service.js');
  const { MockInterviewState } = await loadMain('types/mock-interview.js');

  const originalFetch = globalThis.fetch;
  const state = {
    questionShouldFail: false,
    turnDecision: { action: 'next', follow_up_question: '' },
    reportShouldFail: false,
  };

  globalThis.fetch = async (url) => {
    const path = String(url);
    if (path.includes('/mock-interview/question')) {
      if (state.questionShouldFail) return jsonResponse({ detail: 'error' }, 500);
      return jsonResponse({ text: 'A question', kind: 'technical' });
    }
    if (path.includes('/mock-interview/turn')) {
      return jsonResponse(state.turnDecision);
    }
    if (path.includes('/mock-interview/report')) {
      if (state.reportShouldFail) return jsonResponse({ detail: 'error' }, 500);
      return jsonResponse({
        overall_score: 80,
        strengths: ['clear'],
        gaps: ['depth'],
        questions: [],
      });
    }
    return new Response(null, { status: 404 });
  };

  const setup = {
    role: 'Backend Engineer',
    seniority: 'mid',
    difficulty: 'standard',
    question_count: 2,
  };
  const toListening = () => mockInterviewService.speechFinished();

  try {
    // Zero-answer end must not produce a report - the mock analogue of the export guard.
    await mockInterviewService.start(setup);
    check(
      'starting leaves Idle',
      mockInterviewService.getState().state !== MockInterviewState.Idle
    );
    await mockInterviewService.endSession();
    check(
      'ending with zero answers lands on Idle, not Finished',
      mockInterviewService.getState().state === MockInterviewState.Idle
    );
    check('and produced no report', mockInterviewService.getState().report === null);

    // The ordinary path: one question, one answer, reaches Finished with a report.
    mockInterviewService.clear();
    await mockInterviewService.start({ ...setup, question_count: 1 });
    await toListening();
    mockInterviewService.ingestAnswer('final', 'My real answer.');
    await mockInterviewService.answerFinished();
    check(
      'a single-question session reaches Finished',
      mockInterviewService.getState().state === MockInterviewState.Finished
    );
    check('with a report', mockInterviewService.getState().report !== null);
    check('and no error', mockInterviewService.getState().reportError === null);

    // A failed report must not strand the session mid-Scoring - it still reaches Finished, with
    // the transcript intact and an error saying the score could not be produced.
    state.reportShouldFail = true;
    mockInterviewService.clear();
    await mockInterviewService.start({ ...setup, question_count: 1 });
    await toListening();
    mockInterviewService.ingestAnswer('final', 'Another real answer.');
    await mockInterviewService.answerFinished();
    check(
      'a failed report still reaches Finished, not stuck in Scoring',
      mockInterviewService.getState().state === MockInterviewState.Finished
    );
    check('with reportError set', mockInterviewService.getState().reportError !== null);
    check('and the transcript preserved', mockInterviewService.getState().answers.length === 1);
    state.reportShouldFail = false;

    // A session that cannot generate even its first question must not be stuck in
    // Starting/Generating - it has to fail back to Idle so the setup screen is reachable again.
    state.questionShouldFail = true;
    mockInterviewService.clear();
    let startError = null;
    try {
      await mockInterviewService.start(setup);
    } catch (e) {
      startError = e;
    }
    check('a start that cannot generate a question throws', startError !== null);
    check(
      'and lands back on Idle rather than stuck in Generating',
      mockInterviewService.getState().state === MockInterviewState.Idle
    );
    state.questionShouldFail = false;

    // Skipping every question reaches Idle (nothing to score), and a skip must not itself count
    // as content.
    mockInterviewService.clear();
    await mockInterviewService.start({ ...setup, question_count: 2 });
    await toListening();
    await mockInterviewService.skipQuestion();
    check(
      'skipping the first question advances to the second',
      mockInterviewService.getState().questionNumber === 2
    );
    await toListening();
    await mockInterviewService.skipQuestion();
    check(
      'skipping every question reaches Idle, not Finished',
      mockInterviewService.getState().state === MockInterviewState.Idle
    );

    // End interview mid-session, with real content, still scores what was given.
    mockInterviewService.clear();
    await mockInterviewService.start({ ...setup, question_count: 5 });
    await toListening();
    mockInterviewService.ingestAnswer('final', 'Answered before ending early.');
    await mockInterviewService.answerFinished();
    // Now on question 2 (question_count is 5), still Speaking/Listening either way - endSession
    // must reach Finished from wherever the flow currently is.
    await mockInterviewService.endSession();
    check(
      'ending mid-session with a real answer still reaches Finished',
      mockInterviewService.getState().state === MockInterviewState.Finished
    );

    // A follow-up does not advance the question counter.
    mockInterviewService.clear();
    state.turnDecision = { action: 'follow_up', follow_up_question: 'Can you say more?' };
    await mockInterviewService.start({ ...setup, question_count: 3 });
    await toListening();
    const beforeFollowUp = mockInterviewService.getState().questionNumber;
    mockInterviewService.ingestAnswer('final', 'A vague answer.');
    await mockInterviewService.answerFinished();
    check(
      'a follow-up keeps the same question number',
      mockInterviewService.getState().questionNumber === beforeFollowUp
    );
    check(
      'and marks the current question as a follow-up',
      mockInterviewService.getState().currentQuestion?.isFollowUp === true
    );
    state.turnDecision = { action: 'next', follow_up_question: '' };

    // isActive() must be false at both terminal values, and true everywhere in between - this is
    // exactly the signal the action-suggestion block and startAssistant refusal key off.
    mockInterviewService.clear();
    check('isActive() is false when Idle', mockInterviewService.isActive() === false);
    await mockInterviewService.start({ ...setup, question_count: 1 });
    check('isActive() is true mid-session', mockInterviewService.isActive() === true);
    await toListening();
    mockInterviewService.ingestAnswer('final', 'Last one.');
    await mockInterviewService.answerFinished();
    check('isActive() is false when Finished', mockInterviewService.isActive() === false);

    // The silence backstop: real speech arrives, then nothing more. The armed timer must fire
    // answerFinished() on its own, exactly as if "Done answering" had been clicked - a candidate
    // who trails off must not be stranded in Listening forever.
    mockInterviewService.clear();
    await mockInterviewService.start({ ...setup, question_count: 1 });
    await toListening();

    const originalSetTimeout = globalThis.setTimeout;
    let silenceCallback = null;
    globalThis.setTimeout = (callback, delay) => {
      silenceCallback = callback;
      // A real, inert timer standing in for the captured one, so the service's own
      // `clearTimeout(this.silenceTimer)` calls stay valid - unref'd so it cannot hold the test
      // process open if this branch is ever reached without the manual fire below.
      const timer = originalSetTimeout(() => {}, delay);
      timer.unref?.();
      return timer;
    };
    try {
      mockInterviewService.ingestAnswer('final', 'Answered, then silence.');
      check('a silence timer is armed once real speech arrives', typeof silenceCallback === 'function');
    } finally {
      globalThis.setTimeout = originalSetTimeout;
    }

    silenceCallback();
    // answerFinished() runs its own chain of mocked-but-async fetch calls from here; give it a
    // few real ticks to resolve rather than asserting on the exact microtask it is on.
    await new Promise((resolve) => originalSetTimeout(resolve, 50));
    check(
      'firing the silence timeout reaches Finished, the same as clicking Done answering',
      mockInterviewService.getState().state === MockInterviewState.Finished
    );
    check(
      'and the trailing answer was captured before the timeout fired',
      mockInterviewService.getState().answers[0]?.answer === 'Answered, then silence.'
    );

    // The dead-mic watchdog: Listening begins and nothing is ever said - a mic that failed
    // before the candidate spoke a word, not a candidate who is merely thinking. The armed
    // timer must skip the question on its own once it fires, since there is no answer to submit,
    // rather than stranding the session in Listening indefinitely.
    mockInterviewService.clear();
    await mockInterviewService.start({ ...setup, question_count: 3 });
    // No ingestAnswer() before this - TTS just finished and nothing has been said yet, which is
    // exactly the case the watchdog exists for.
    let watchdogCallback = null;
    let watchdogDelay = null;
    globalThis.setTimeout = (callback, delay) => {
      watchdogCallback = callback;
      watchdogDelay = delay;
      const timer = originalSetTimeout(() => {}, delay);
      timer.unref?.();
      return timer;
    };
    try {
      await toListening();
      check('entering Listening with nothing said arms a watchdog', typeof watchdogCallback === 'function');
      check(
        'using the long dead-mic delay, not the short post-speech one',
        typeof watchdogDelay === 'number' && watchdogDelay >= 30000
      );
    } finally {
      globalThis.setTimeout = originalSetTimeout;
    }

    const questionNumberBeforeWatchdog = mockInterviewService.getState().questionNumber;
    watchdogCallback();
    await new Promise((resolve) => originalSetTimeout(resolve, 50));
    check(
      'firing the watchdog with nothing said skips the question, not submits an empty answer',
      mockInterviewService.getState().answers[0]?.skipped === true
    );
    check(
      'and advances rather than hanging in Listening',
      mockInterviewService.getState().questionNumber === questionNumberBeforeWatchdog + 1
    );

    // Real speech arriving must disarm the dead-mic watchdog and hand off to the short
    // post-speech backstop - the two must not both end up armed, or fire in the wrong order.
    mockInterviewService.clear();
    await mockInterviewService.start({ ...setup, question_count: 1 });
    await toListening();
    mockInterviewService.ingestAnswer('final', 'The mic works fine.');
    await mockInterviewService.answerFinished();
    check(
      'real speech after entering Listening submits normally, not as skipped',
      mockInterviewService.getState().answers[0]?.skipped === false
    );
    check(
      'with the actual answer text preserved',
      mockInterviewService.getState().answers[0]?.answer === 'The mic works fine.'
    );

    // Regression: endSession() landing between answerFinished()'s synchronous answer-push and
    // its evaluateTurn round trip used to resurrect and re-add the same answer a second time,
    // because finalAnswerText was not cleared until installQuestion ran for the *next* question -
    // which this race never reaches. See mockInterviewService.answerFinished.
    mockInterviewService.clear();
    await mockInterviewService.start({ ...setup, question_count: 3 });
    await toListening();
    mockInterviewService.ingestAnswer('final', 'Answered right before ending.');
    const answerFinishedRace = mockInterviewService.answerFinished();
    await mockInterviewService.endSession();
    await answerFinishedRace;
    check(
      'ending while answerFinished is still awaiting evaluateTurn does not duplicate the answer',
      mockInterviewService.getState().answers.length === 1
    );
    check(
      'and the one answer recorded is the real one, not a resurrected duplicate',
      mockInterviewService.getState().answers[0]?.answer === 'Answered right before ending.'
    );

    // Same race, reached through Skip instead of Done answering: a partial the candidate never
    // submitted must not be resurrected onto a question they explicitly chose to skip. See
    // mockInterviewService.skipQuestion. A real first answer is needed before this: ending with
    // only a skip on the books has no real content, so endSession() takes the "nothing to score"
    // reset-to-initial branch instead of the scoring branch this race is about, regardless of the
    // bug under test.
    mockInterviewService.clear();
    await mockInterviewService.start({ ...setup, question_count: 3 });
    await toListening();
    mockInterviewService.ingestAnswer('final', 'A real first answer.');
    await mockInterviewService.answerFinished();
    await toListening();
    // 'final' ASR segments accumulate into finalAnswerText as the candidate speaks, independent
    // of "Done answering" actually being clicked - a 'partial' would not reproduce this, since
    // only a 'final' type touches finalAnswerText at all (see ingestAnswer).
    mockInterviewService.ingestAnswer('final', 'Spoken but never submitted before skipping.');
    const skipRace = mockInterviewService.skipQuestion();
    await mockInterviewService.endSession();
    await skipRace;
    check(
      'ending while skipQuestion is still advancing does not resurrect the unsubmitted partial',
      mockInterviewService.getState().answers.length === 2
    );
    check(
      'and the second answer recorded is the skip, not the unsubmitted partial',
      mockInterviewService.getState().answers[1]?.skipped === true
    );
  } finally {
    globalThis.fetch = originalFetch;
    mockInterviewService.clear();
  }

  return failures;
}
