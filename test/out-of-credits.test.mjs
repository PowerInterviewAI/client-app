/**
 * What happens when the backend closes an audio socket because the balance ran out.
 *
 * Every interview is metered by the minute on its ASR socket, and the backend ends that socket
 * with close code 4402 when the balance reaches zero - mid-session, or straight after accepting a
 * socket opened at zero. Everything that can go wrong here fails quietly:
 *
 * - a 4402 treated as an ordinary disconnect is retried by the backoff loop forever, against a
 *   backend that refuses every attempt, while the session sits on screen with no transcription;
 * - a 4402 checked after `active` is missed for a socket refused during `start()`, which then
 *   reports a session that started when it did not;
 * - two live channels each reporting it end the session twice - two save prompts, two toasts;
 * - a 4402 while a mock is being scored ends a session that is already writing its report.
 *
 * Source-level, like `language-switch.test.mjs`: renderer code with no runtime harness here.
 */
import { codeOnly, createChecker, methodBody, readSource } from './helpers.mjs';

const read = (path) => codeOnly(readSource(new URL(path, import.meta.url)));

export async function run() {
  const { check, failures } = createChecker('out-of-credits');

  const live = read('../src/renderer/services/live-transcription.service.ts');
  const mock = read('../src/renderer/services/mock-transcription.service.ts');
  const mockHook = read('../src/renderer/hooks/use-mock-interview.ts');
  const controlPanel = read('../src/renderer/components/custom/control-panel/index.tsx');

  check(
    'the close code mirrors the backend',
    live.includes('WS_CLOSE_INSUFFICIENT_CREDITS = 4402')
  );

  // --- no reconnect ----------------------------------------------------------------------

  const bindHandlers = methodBody(live, 'private bindWebSocketHandlers(');
  const onclose = bindHandlers.slice(bindHandlers.indexOf('ws.onclose'));
  const creditsCheck = onclose.indexOf('WS_CLOSE_INSUFFICIENT_CREDITS');
  check('the bound close handler looks for the credits code', creditsCheck > 0);
  check(
    'before the `active` check, so a socket refused during start() is not missed',
    creditsCheck > 0 && creditsCheck < onclose.indexOf('!this.active')
  );
  check(
    'and before the reconnect is scheduled',
    creditsCheck > 0 && creditsCheck < onclose.indexOf('this.scheduleReconnect()')
  );

  const scheduleReconnect = methodBody(live, 'private scheduleReconnect(');
  check(
    'a channel out of credits never schedules a reconnect',
    scheduleReconnect.includes('this.outOfCredits')
  );

  const connectWithRetry = methodBody(live, 'private async connectWithRetry(');
  check(
    'the retry loop rethrows a credits refusal instead of trying again',
    /instanceof OutOfCreditsError[\s\S]{0,200}throw error/.test(connectWithRetry)
  );
  check(
    'and reports it, so a reconnect refused before it opened still ends the session',
    /instanceof OutOfCreditsError[\s\S]{0,200}this\.handleOutOfCredits\(\)/.test(connectWithRetry)
  );

  const connectWebSocket = methodBody(live, 'private connectWebSocket(');
  check(
    'a close that beats the open is still read for its code',
    /ws\.onclose[\s\S]{0,200}WS_CLOSE_INSUFFICIENT_CREDITS/.test(connectWebSocket)
  );

  const start = methodBody(live, 'async start() {');
  check(
    'start() throws for a socket refused while it was building the graph',
    /if \(this\.outOfCredits\) throw new OutOfCreditsError\(\)/.test(start)
  );

  const handle = methodBody(live, 'private handleOutOfCredits(');
  check('a channel reports once', /if \(this\.outOfCredits\) return;/.test(handle));
  check(
    'and only for a running session',
    handle.includes('if (this.active) this.onOutOfCredits?.()')
  );

  // --- one stop per session ------------------------------------------------------------------

  const report = methodBody(live, 'private reportOutOfCredits(');
  check(
    'two live channels end the session once',
    /if \(this\.outOfCreditsReported\) return;/.test(report)
  );
  check(
    'and the guard is reset for each new session',
    live.includes('this.outOfCreditsReported = false;')
  );

  check(
    'the live console ends the session through the Stop path',
    /liveTranscriptionService\.onOutOfCredits\([\s\S]{0,400}endLiveSessionRef\.current\(\)/.test(
      controlPanel
    )
  );

  // --- the mock -------------------------------------------------------------------------------

  check('the mock socket reports it', mock.includes('onOutOfCredits'));
  const mockSubscription = mockHook.slice(
    mockHook.indexOf('mockTranscriptionService.onOutOfCredits')
  );
  check(
    'a mock being scored is left alone, so its report is not discarded',
    /MockInterviewState\.Scoring[\s\S]{0,300}return;/.test(mockSubscription)
  );
  check(
    'otherwise it ends the way End does, keeping the answer in progress',
    mockSubscription.includes('mockInterview.endSession()')
  );

  // --- the warnings before it -----------------------------------------------------------

  const warning = read('../src/renderer/hooks/use-low-balance-warning.ts');
  const mockPage = read('../src/renderer/pages/mock-interview/index.tsx');
  check('there is a warning at five minutes and at one', warning.includes('[5, 1] as const'));
  check('each fires once per session', /warned\.current\.has\(lowest\)/.test(warning));
  check(
    'and they re-arm when a session ends',
    /if \(!active\) \{\s*warned\.current\.clear\(\)/.test(warning)
  );
  check(
    'the live console warns while running',
    controlPanel.includes('useLowBalanceWarning(runningState === RunningState.Running)')
  );
  check(
    'the mock page warns while the session runs, but not over the report being scored',
    /useLowBalanceWarning\([\s\S]{0,200}MockInterviewState\.Scoring/.test(mockPage)
  );

  // --- the ledger tags ---------------------------------------------------------------------

  const buildUrl = methodBody(live, 'function buildStreamingUrl(');
  check('a mock socket says it is a mock', buildUrl.includes("params.set('kind', kind)"));
  check(
    'only when it is not live, whose absence is the default',
    buildUrl.includes("kind !== 'live'")
  );
  check('every socket carries the client session id', buildUrl.includes("'client_session_id'"));
  check(
    'and both live channels share one id',
    /const options = \{[\s\S]{0,200}clientSessionId: crypto\.randomUUID\(\)/.test(live)
  );

  return failures;
}
