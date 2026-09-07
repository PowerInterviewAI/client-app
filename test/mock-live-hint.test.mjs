/**
 * The optional live-suggestion hint a mock session generates alongside each question.
 *
 * Driven through a fake `globalThis.fetch` like `mock-interview-state.test.mjs`, for the same
 * reason: the hint is a real streaming HTTP request built inside the service, and what has to hold
 * is the shape that goes out and the state the card lands in - not that some stubbed method was
 * called. Four things fail silently in production if they break:
 *
 * - The request must end on the interviewer's turn carrying the question, or the backend answers
 *   the wrong turn. It must carry `turn_verdict: answer`, since a generated question is never an
 *   ASR fragment and there is nothing for the backend's own classifier to settle.
 * - Prior turns must travel with it, or every hint answers the question as if it were the first.
 * - A hint superseded by the next question must land on a terminal state. Left `loading` it is a
 *   spinner that never resolves, on a card for a question the candidate has already moved past.
 * - With the toggle off, no request may be made at all - not one whose result is merely discarded.
 */
import { createChecker, loadMain } from './helpers.mjs';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** A response body that yields `chunks`, then either closes or hangs until the signal aborts. */
function streamResponse(chunks, { hang = false, signal } = {}) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      if (!hang) {
        controller.close();
        return;
      }
      // Mirrors a real fetch: the body errors when the caller aborts, rather than hanging on
      // past the abort and keeping the process alive.
      signal?.addEventListener('abort', () => {
        try {
          controller.error(new DOMException('aborted', 'AbortError'));
        } catch {
          // already closed
        }
      });
    },
  });
  return new Response(stream, { status: 200 });
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(predicate, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await wait(10);
  }
  return false;
}

export async function run() {
  const { check, failures } = createChecker('mock-live-hint');

  const { mockInterviewService } = await loadMain('services/mock-interview.service.js');
  const { configStore } = await loadMain('store/config.store.js');

  const originalFetch = globalThis.fetch;
  const originalConfig = configStore.getConfig();

  const hintRequests = [];
  let hintChunks = ['Talk about the migration you led.'];
  let hintHangs = false;
  let questionNumber = 0;

  globalThis.fetch = async (url, init = {}) => {
    const path = String(url);

    if (path.includes('/mock-interview/question')) {
      questionNumber += 1;
      return jsonResponse({ text: `Question ${questionNumber}`, kind: 'technical' });
    }
    if (path.includes('/mock-interview/turn')) {
      return jsonResponse({ action: 'next', follow_up_question: '' });
    }
    if (path.includes('/mock-interview/report')) {
      return jsonResponse({
        overall_score: 80,
        strengths: ['clear'],
        gaps: ['depth'],
        questions: [],
      });
    }
    if (path.includes('/api/llm/live-suggestion')) {
      hintRequests.push(JSON.parse(init.body));
      return streamResponse(hintChunks, { hang: hintHangs, signal: init.signal });
    }
    return new Response(null, { status: 404 });
  };

  const setup = { seniority: 'mid', difficulty: 'standard', question_count: 3 };
  const hints = () => mockInterviewService.getState().liveHints;
  const toListening = () => mockInterviewService.speechFinished();

  try {
    configStore.updateConfig({ mockLiveSuggestionsEnabled: true, hintOnlyMode: false });

    // --- a hint is generated for the question that was just asked -------------------------
    await mockInterviewService.start(setup);
    const streamed = await waitFor(() => hints()[0]?.state === 'success');

    check('a hint is generated for the first question', hints().length === 1);
    check('and it streams to a terminal success state', streamed);
    check('carrying the question it answers', hints()[0]?.last_question === 'Question 1');
    check('and the streamed answer', hints()[0]?.answer === 'Talk about the migration you led.');
    check('generated under the configured mode', hints()[0]?.mode === 'normal');

    // --- the request the backend actually receives ----------------------------------------
    const first = hintRequests[0];
    check('the request trusts the client gate', first?.turn_verdict === 'answer');
    const lastTranscript = first?.transcripts?.[first.transcripts.length - 1];
    check('and ends on the interviewer turn', lastTranscript?.speaker === 'other');
    check('carrying the question text', lastTranscript?.text === 'Question 1');

    // --- prior turns travel with the next question ----------------------------------------
    await toListening();
    mockInterviewService.ingestAnswer('final', 'I led the migration end to end.');
    await mockInterviewService.answerFinished();
    await waitFor(() => hintRequests.length === 2);

    const second = hintRequests[1];
    const shape = (second?.transcripts ?? []).map((t) => `${t.speaker}:${t.text}`);
    check(
      'the next hint carries the question, the answer, and the new question',
      JSON.stringify(shape) ===
        JSON.stringify([
          'other:Question 1',
          'self:I led the migration end to end.',
          'other:Question 2',
        ])
    );

    // --- a hint superseded mid-stream lands on a terminal state ---------------------------
    mockInterviewService.clear();
    hintRequests.length = 0;
    questionNumber = 0;
    hintHangs = true;
    hintChunks = ['Half an ans'];

    await mockInterviewService.start(setup);
    await waitFor(() => hints()[0]?.answer === 'Half an ans');

    hintHangs = false;
    await toListening();
    mockInterviewService.ingestAnswer('final', 'An answer.');
    await mockInterviewService.answerFinished();

    const superseded = await waitFor(() => hints()[0]?.state === 'stopped');
    check('a hint superseded by the next question is stopped, not left loading', superseded);
    check('and keeps the text it had streamed so far', hints()[0]?.answer === 'Half an ans');

    // --- the toggle stops the request being made at all -----------------------------------
    mockInterviewService.clear();
    configStore.updateConfig({ mockLiveSuggestionsEnabled: false });
    hintRequests.length = 0;
    questionNumber = 0;

    await mockInterviewService.start(setup);
    await wait(50);

    check('the toggle makes no live-suggestion request at all', hintRequests.length === 0);
    check('and leaves the session with no hints', hints().length === 0);

    // --- clearing a session drops its hints ------------------------------------------------
    configStore.updateConfig({ mockLiveSuggestionsEnabled: true });
    mockInterviewService.clear();
    questionNumber = 0;
    await mockInterviewService.start(setup);
    await waitFor(() => hints().length === 1);
    mockInterviewService.clear();

    check('clear drops every hint with the session', hints().length === 0);
  } finally {
    mockInterviewService.clear();
    globalThis.fetch = originalFetch;
    configStore.updateConfig({
      mockLiveSuggestionsEnabled: originalConfig.mockLiveSuggestionsEnabled,
      hintOnlyMode: originalConfig.hintOnlyMode,
    });
  }

  return failures;
}
