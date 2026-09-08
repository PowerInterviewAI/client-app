/**
 * The question's voice has to be in hand before the question is on screen, or the two do not
 * start together.
 *
 * This is the ordering that a reveal animation cannot fix and that nothing else in this directory
 * covers. `installQuestion` used to broadcast `Speaking` and let the renderer discover it, ask for
 * chunk 0 over IPC, and only then pay a round trip to /speak - so the words went up and the voice
 * followed a second or two later, every question. Reversing it is invisible in the type system and
 * reads as a pointless await if you do not know what it buys.
 *
 * Driven through a fake `globalThis.fetch` like `mock-interview-state.test.mjs`, because the
 * service builds its own `MockInterviewApi` and the thing being pinned is *when* a real request
 * goes out relative to a broadcast.
 *
 * English is used throughout: it always has an Aura voice, so every question here enters
 * `Speaking` and has chunks to synthesize.
 */
import { createChecker, loadMain } from './helpers.mjs';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function audioResponse() {
  return new Response(new Uint8Array([0x49, 0x44, 0x33, 0x04]), {
    status: 200,
    headers: { 'content-type': 'audio/mpeg' },
  });
}

export async function run() {
  const { check, failures } = createChecker('mock-question-prime');

  const { mockInterviewService } = await loadMain('services/mock-interview.service.js');
  const { MockInterviewState } = await loadMain('types/mock-interview.js');

  const originalFetch = globalThis.fetch;

  const QUESTION = 'Tell me about a system you designed. What did you get wrong?';
  let speakCalls = [];
  let speakShouldFail = false;
  // Resolvers for every /speak in flight, so a synthesis can be held open long enough to observe
  // what the session does while it waits.
  let holdSpeak = null;

  globalThis.fetch = async (url, init) => {
    const path = String(url);
    if (path.includes('/mock-interview/question')) {
      return jsonResponse({ text: QUESTION, kind: 'technical' });
    }
    if (path.includes('/mock-interview/speak')) {
      speakCalls.push(JSON.parse(init.body).text);
      if (holdSpeak) await new Promise((resolve) => holdSpeak.push(resolve));
      if (speakShouldFail) return jsonResponse({ detail: 'tts down' }, 500);
      return audioResponse();
    }
    if (path.includes('/mock-interview/turn')) {
      return jsonResponse({ action: 'next', follow_up_question: '' });
    }
    if (path.includes('/mock-interview/report')) {
      return jsonResponse({ overall_score: 80, strengths: [], gaps: [], questions: [] });
    }
    return new Response(null, { status: 404 });
  };

  const setup = {
    role: 'Backend Engineer',
    seniority: 'mid',
    difficulty: 'standard',
    question_count: 2,
  };

  try {
    // 1. The ordering itself: by the time the question exists, its first sentence has been asked
    //    for. Asserted on the state after `start()` resolves rather than by intercepting the
    //    broadcast, because `installQuestion` writes the session and broadcasts in the same tick -
    //    there is no moment where one has happened and the other has not.
    speakCalls = [];
    await mockInterviewService.start(setup);

    const installed = mockInterviewService.getState();
    check('the question reaches Speaking', installed.state === MockInterviewState.Speaking);
    check('and it is a question with audio', installed.currentQuestion?.hasAudio === true);
    check(
      'the first sentence was synthesized before the question was installed',
      speakCalls.length === 1
    );
    check(
      'and it is the question that was installed',
      installed.currentQuestion?.chunks[0] === speakCalls[0]
    );

    // 2. The renderer then asks for chunk 0 the moment it sees `Speaking`. That must be served
    //    from the prime: a second request here is the same billed synthesis twice, and is the
    //    round trip the prime exists to have already paid.
    const primed = await mockInterviewService.synthesizeChunk(0);
    check('chunk 0 comes back with audio', primed instanceof ArrayBuffer && primed.byteLength > 0);
    check('and costs no second synthesis', speakCalls.length === 1);

    // A later chunk is not primed and is fetched normally - the prime is the first sentence only,
    // since it is the only one whose latency is in front of the candidate.
    const chunks = installed.currentQuestion?.chunks ?? [];
    if (chunks.length > 1) {
      await mockInterviewService.synthesizeChunk(1);
      check('a later chunk is still fetched on demand', speakCalls.length === 2);
    }

    await mockInterviewService.clear();

    // 3. A synthesis that fails is not cached as an answer. The renderer's own request has to go
    //    out fresh, or one transient TTS failure would silently drop the voice for that question
    //    when a retry would have got it.
    speakCalls = [];
    speakShouldFail = true;
    await mockInterviewService.start(setup);
    check('a failed prime still installs the question', speakCalls.length === 1);
    check(
      'and still reaches Speaking rather than stalling',
      mockInterviewService.getState().state === MockInterviewState.Speaking
    );

    speakShouldFail = false;
    const retried = await mockInterviewService.synthesizeChunk(0);
    check('the failed prime is not served as the answer', speakCalls.length === 2);
    check('so the retry gets real audio', retried instanceof ArrayBuffer && retried.byteLength > 0);

    await mockInterviewService.clear();

    // 4. A session ended while the prime is still in flight installs nothing. The generation
    //    token is checked after the wait, so a question cannot land on a session that is over -
    //    which is the failure the wait newly makes reachable, since nothing used to await here.
    speakCalls = [];
    holdSpeak = [];
    const starting = mockInterviewService.start(setup);
    // Let the question request resolve and the prime go out.
    while (speakCalls.length === 0) await new Promise((resolve) => setImmediate(resolve));
    check(
      'the session is still Generating while the voice is synthesized',
      mockInterviewService.getState().state === MockInterviewState.Generating
    );

    mockInterviewService.clear();
    for (const resolve of holdSpeak) resolve();
    holdSpeak = null;
    await starting;
    check(
      'a session cleared mid-prime installs no question',
      mockInterviewService.getState().state === MockInterviewState.Idle
    );
    check(
      'and leaves no question behind it',
      mockInterviewService.getState().currentQuestion === null
    );
  } finally {
    globalThis.fetch = originalFetch;
    mockInterviewService.clear();
  }

  return failures;
}
