/**
 * How a mock interview is billed, and the one parameter that keeps it right.
 *
 * Every interview, live or mock, is billed by the minute on its ASR socket at the same rate, and
 * nothing else charges. A mock interview used to be priced per question, follow-up and report,
 * with `billing=per_turn` on the requests and `metered=0` on the socket; both are gone, and a
 * backend still running that scheme reads their absence as "meter this socket by the minute".
 * So every pairing of this client with any backend lands on exactly one bill.
 *
 * What must still never happen is a mock billed at half rate, and there is one way to cause it:
 * drop `channels=1`. The backend divides the per-minute price by the number of sockets a session
 * holds, defaulting to the live session's two, so a mock socket that does not say it is alone
 * pays half.
 *
 * Source-level, like `mock-tts-playback.test.mjs`: this is renderer and main-process code with no
 * runtime harness in this directory, and every failure here is a number in a database being wrong
 * with nothing on screen to show for it.
 */
import { codeOnly, createChecker, methodBody, readSource } from './helpers.mjs';

const read = (path) => codeOnly(readSource(new URL(path, import.meta.url)));

export async function run() {
  const { check, failures } = createChecker('mock-billing-contract');

  const live = read('../src/renderer/services/live-transcription.service.ts');
  const mock = read('../src/renderer/services/mock-transcription.service.ts');
  const service = read('../src/main/services/mock-interview.service.ts');
  const types = read('../src/main/types/mock-interview.ts');

  // --- the socket ------------------------------------------------------------------------

  const buildUrl = methodBody(live, 'function buildStreamingUrl(');
  check('there is a streaming URL builder to read', buildUrl.length > 0);

  // An installed backend that still honours `metered=0` would bill nothing for the session,
  // while the requests no longer carry the per-turn charges that used to pay for it.
  check('the socket never asks not to be metered', !buildUrl.includes("'metered'"));
  check('the mock socket declares its single channel', mock.includes('MOCK_STREAM_CHANNELS'));

  // --- the requests ----------------------------------------------------------------------

  // A per-turn declaration on a request would be honoured by a backend that predates the switch
  // to the minute, which would then charge per turn *and* run the clock: the one outcome that
  // must not happen.
  check('no request declares per-turn billing', !/billing:/.test(service));
  check('there is no billing enum left to send', !/per_turn/.test(types));
  check(
    'the turn request no longer carries a billing budget',
    !service.includes('remaining_questions')
  );

  return failures;
}
