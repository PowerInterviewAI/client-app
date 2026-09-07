/**
 * The turn a language with no Aura voice produces, which is a different shape from every other
 * test in this directory and is the one nothing covered.
 *
 * A spoken question carries its own boundary: the microphone is gated shut for the whole of the
 * interviewer's speech, so the answer cannot begin before the question ends. A text-only question
 * has none - `installQuestion` goes straight to `Listening` with the words on screen and the
 * microphone already open - so the renderer gates the turn behind an "I'm ready" button instead,
 * and `answerReady()` is what opens it.
 *
 * What is pinned here is that the gate holds the *transcript* and not only the silence clock.
 * Holding the clock alone was the shipped behaviour and it looks correct right up to the point
 * where anything is said while the question is being read: those words went into the answer, and
 * `MOCK_ANSWER_SILENCE_MS` then submitted the turn eight seconds later without a word of it
 * having been meant as one.
 *
 * Polish is the voiceless language used throughout - it is in the ASR's 28 and not in the seven
 * Aura speaks - and the language is read once at `start()`, so it is set on the store first.
 */
import { createChecker, loadMain } from './helpers.mjs';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function run() {
  const { check, failures } = createChecker('mock-text-only-turn');

  const { mockInterviewService } = await loadMain('services/mock-interview.service.js');
  const { MockInterviewState } = await loadMain('types/mock-interview.js');
  const { TTS_LANGUAGES, Language } = await loadMain('types/language.js');
  const { configStore } = await loadMain('store/config.store.js');

  check('the language under test really has no voice', !TTS_LANGUAGES.has(Language.Polish));

  const originalFetch = globalThis.fetch;
  const originalLanguage = configStore.getConfig().language;

  globalThis.fetch = async (url) => {
    const path = String(url);
    if (path.includes('/mock-interview/question')) {
      return jsonResponse({ text: 'Opisz swoje doświadczenie.', kind: 'technical' });
    }
    if (path.includes('/mock-interview/turn')) {
      return jsonResponse({ action: 'next', follow_up_question: '' });
    }
    if (path.includes('/mock-interview/report')) {
      return jsonResponse({ overall_score: 70, strengths: [], gaps: [], questions: [] });
    }
    return new Response(null, { status: 404 });
  };

  try {
    configStore.updateConfig({ language: Language.Polish });
    await mockInterviewService.start({
      role: '',
      seniority: 'mid',
      difficulty: 'standard',
      question_count: 2,
    });

    const installed = mockInterviewService.getState();
    check(
      'a voiceless language skips Speaking entirely',
      installed.state === MockInterviewState.Listening
    );
    check('and marks the question as unspoken', installed.currentQuestion?.hasAudio === false);
    check('so nothing is synthesised for it', installed.currentQuestion?.chunks.length === 0);

    // Everything said while the question is still being read.
    mockInterviewService.ingestAnswer('final', 'hmm, chwileczkę');
    check(
      'speech before the candidate is ready is dropped',
      mockInterviewService.getState().currentAnswerText === ''
    );

    mockInterviewService.answerReady();
    mockInterviewService.ingestAnswer('final', 'Pracowałem nad tym przez trzy lata.');
    check(
      'and speech after it is kept',
      mockInterviewService.getState().currentAnswerText === 'Pracowałem nad tym przez trzy lata.'
    );
    check(
      'with nothing carried over from before the gate opened',
      !mockInterviewService.getState().currentAnswerText.includes('chwileczkę')
    );

    // The gate belongs to one turn. It is cleared when the turn is submitted, so the *next*
    // question installs its own - a gate left standing would silently discard the whole of the
    // following answer, with the status line still saying the candidate was being heard.
    await mockInterviewService.answerFinished();
    const next = mockInterviewService.getState();
    check('the next question is text-only too', next.currentQuestion?.hasAudio === false);
    mockInterviewService.ingestAnswer('final', 'przedwczesna odpowiedź');
    check(
      'and re-arms the gate rather than inheriting the open one',
      mockInterviewService.getState().currentAnswerText === ''
    );
  } finally {
    mockInterviewService.clear();
    configStore.updateConfig({ language: originalLanguage });
    globalThis.fetch = originalFetch;
  }

  return failures;
}
