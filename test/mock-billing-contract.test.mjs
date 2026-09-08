/**
 * The two halves of a mock interview's billing declaration, and why neither may travel alone.
 *
 * A mock interview is charged per question, follow-up and report rather than by the minute, and
 * its ASR socket therefore asks not to be metered. Both facts are things only this side knows, so
 * both are things this side says: `billing` on the three charged requests, `metered=0` on the
 * socket. The backend is deployed by hand and this client ships on its own schedule, so every
 * mixed pairing has to land on exactly one bill.
 *
 *   new client + new backend   `billing` honoured, `metered=0` honoured   -> per-turn
 *   new client + old backend   both ignored, `channels=1` still sent      -> the old per-minute meter
 *   old client + new backend   no `billing`, no `metered`                 -> the old per-minute meter
 *
 * What must never happen is a session billed twice, and there are exactly two ways to cause it:
 * send `billing` without `metered=0` (a current backend charges per turn *and* runs the clock),
 * or drop `channels=1` now that `metered=0` exists (an older backend ignores `metered`, falls
 * back to its default of two channels, and halves the bill of every mock interview).
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

  check('the socket can declare itself unmetered', buildUrl.includes("params.set('metered'"));
  check(
    'and only says so when it is not the default, like language and channels',
    /if \(metering !== StreamMetering\.Metered\) params\.set\('metered'/.test(buildUrl)
  );
  check(
    'the default is metered, so a caller that says nothing is billed as it always was',
    /metering: StreamMetering = StreamMetering\.Metered/.test(live)
  );

  // The mock socket sends both, and this is the pairing that a tidy-up breaks: `channels=1` looks
  // redundant once `metered=0` exists, and dropping it halves every mock bill on any backend that
  // has not been updated yet.
  check('the mock socket asks not to be metered', mock.includes('StreamMetering.Unmetered'));
  check('and still declares its single channel', mock.includes('MOCK_STREAM_CHANNELS'));

  // --- the requests ----------------------------------------------------------------------

  check('there is a billing enum with the per-turn value', /PerTurn = 'per_turn'/.test(types));
  check(
    'and the three charged requests share one declaration rather than three copies',
    types.includes('interface BilledMockRequest') &&
      types.includes('GenerateMockQuestionRequest extends BilledMockRequest') &&
      types.includes('EvaluateMockTurnRequest extends BilledMockRequest') &&
      types.includes('GenerateMockReportRequest extends BilledMockRequest')
  );

  // Every request that is charged for says how. One that forgets is not an error anywhere: the
  // backend reads the absence as an older client and silently charges nothing for that call.
  const billingDeclarations = (service.match(/billing: MockBilling\.PerTurn/g) ?? []).length;
  check('all three requests declare per-turn billing', billingDeclarations === 3);

  // The follow-up's own guard needs to know what the rest of the session still owes, and the
  // backend cannot work it out: `history` counts turns, so it runs ahead of the question number
  // wherever a follow-up was asked.
  check('the turn request carries what the session still owes', service.includes('remaining_questions:'));
  check(
    'counted off the question number, which a follow-up does not advance',
    /remainingQuestions = Math\.max\([\s\S]{0,200}questionNumber/.test(service)
  );

  return failures;
}
