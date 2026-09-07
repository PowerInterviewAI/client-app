/**
 * Mid-interview language switching is renderer code, so these are source-level checks on
 * `live-transcription.service.ts`, for the same reason `audio-device-switch.test.mjs` is: the
 * renderer has no runtime harness here, and the invariants below are ordering ones that a later
 * tidy-up would break without any symptom a type checker or a linter can see.
 *
 * The failure being guarded against: two language switches overlapping. The language rides on
 * the socket, so a switch is a reconnect, and `connectWebSocket` assigns `this.ws` synchronously
 * per attempt. Without a generation token an older connect loop waking from its backoff
 * overwrites the socket a newer switch has already opened - and the newer one is then
 * unreferenced, so nothing closes it on stop() and the backend session behind it stays open for
 * the life of the app, transcribing a language nobody selected.
 *
 * The window is real rather than theoretical: the picker disables its trigger on `switching`,
 * but the hook only sets that after awaiting the config write, so a second pick lands in
 * between. That is a guard in a different layer from the bug, which is why it is not the fix.
 */
import { codeOnly, createChecker, methodBody, readSource } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('language-switch');

  const source = readSource(
    new URL('../src/renderer/services/live-transcription.service.ts', import.meta.url)
  );

  // The anchors below contain literal newlines, which is only safe because `readSource`
  // normalises: `core.autocrlf` is on with no `.gitattributes`, so this source arrives CRLF on a
  // Windows checkout and LF in CI. Read raw, every one of them matches on the runner and fails
  // on the machine the project is developed on.
  check('the source is read with its line endings normalised', !source.includes('\r'));

  // Both classes declare `async setLanguage(language: Language)`. The channel's is the first in
  // the file and the service's wraps it, so they are picked apart by what follows the brace.
  const body = methodBody(source, 'async setLanguage(language: Language): Promise<void> {\n    if');
  const bodyCode = codeOnly(body);
  check('the channel-level setLanguage exists', body.length > 0);

  // Recorded before the early returns, or a switch made while the channel is between start() and
  // stop() is dropped: start() reads the field when it builds its first URL.
  check(
    'the language is recorded before any early return',
    bodyCode.indexOf('this.language = language') < bodyCode.indexOf('if (this.stopping')
  );

  // Keyed on the socket rather than on `active`: start() sets `active` only after its first
  // connect returns, and in that window a socket already exists on the old language.
  check(
    'a switch while nothing is connected is a no-op',
    /if \(this\.stopping \|\| !this\.ws\) return;/.test(bodyCode)
  );

  check(
    'a generation is taken before anything is torn down',
    /const seq = \+\+this\.switchSeq;/.test(bodyCode)
  );
  check(
    'the generation is taken before the socket is closed',
    bodyCode.indexOf('++this.switchSeq') < bodyCode.indexOf('this.ws.close()')
  );
  check(
    'the generation is taken before the connect is awaited',
    bodyCode.indexOf('++this.switchSeq') < bodyCode.indexOf('await this.connectWithRetry()')
  );

  // A superseded switch must not reach its own backoff: the switch that replaced it has a
  // connect in flight and a backoff of its own, and a second socket beside that one is exactly
  // the leak the generation exists to prevent.
  const failurePath = bodyCode.slice(bodyCode.indexOf('} catch'));
  check(
    'a superseded switch bails out of the failure path',
    /seq !== this\.switchSeq\) return;/.test(failurePath)
  );
  check(
    'it bails out before scheduling its own reconnect',
    failurePath.indexOf('seq !== this.switchSeq') < failurePath.indexOf('this.scheduleReconnect()')
  );

  // An older switch clearing the flag would re-arm the ordinary reconnect underneath the newer
  // switch's own close, which is the second socket again by another route.
  check(
    'only the owning switch clears the switching flag',
    /if \(seq === this\.switchSeq\) this\.switching = false;/.test(bodyCode)
  );

  // The switch is a deliberate reconnect, so the in-flight utterance never gets its final. Left
  // to onclose it would be swallowed: `new WebSocket` reassigns `this.ws` synchronously, so the
  // old socket is no longer the current one by the time its close event fires.
  check(
    'the orphaned utterance is reported by the switch itself',
    bodyCode.includes('this.reportDisconnected()')
  );

  const retry = codeOnly(methodBody(source, 'private async connectWithRetry('));
  check('connectWithRetry exists', retry.length > 0);

  // Captured at entry, not read per attempt: the loop belongs to whichever switch, start or
  // reconnect began it.
  check(
    'the connect loop captures the generation it began under',
    /const seq = this\.switchSeq;/.test(retry)
  );

  // Before the socket is built, not only after. The next line assigns `this.ws`, so a superseded
  // loop waking from its backoff would otherwise overwrite the newer switch's socket.
  check(
    'a superseded attempt stops before opening another socket',
    retry.indexOf('seq !== this.switchSeq') < retry.indexOf('await this.connectWebSocket(')
  );
  check('the generation is handed to the connect', /connectWebSocket\(seq\)/.test(retry));

  // The open window is up to WS_OPEN_TIMEOUT_MS, which is long enough to cover a second pick.
  const connect = codeOnly(methodBody(source, 'private connectWebSocket(seq: number)'));
  check('connectWebSocket takes the generation', connect.length > 0);
  check(
    'a socket that opened after being superseded is closed rather than bound',
    /seq !== this\.switchSeq/.test(connect) &&
      connect.indexOf('seq !== this.switchSeq') < connect.indexOf('this.bindWebSocketHandlers(ws)')
  );

  // setLanguage clears a pending timer, but one that had already fired reaches connectWithRetry
  // on its own and would reconnect on the language the user has just moved off - then reschedule
  // itself when the supersession check throws, opening a second socket a second later.
  const reconnect = codeOnly(methodBody(source, 'private scheduleReconnect('));
  check('scheduleReconnect exists', reconnect.length > 0);
  check(
    'a reconnect records the generation it was scheduled under',
    /const seq = this\.switchSeq;/.test(reconnect)
  );
  check(
    'a superseded reconnect neither connects nor reschedules',
    (reconnect.match(/seq !== this\.switchSeq\) return;/g) ?? []).length === 2
  );

  // Both channels move together, and one failing must not hide the other's rejection: `all`
  // rejects on the first and leaves the second unhandled, which surfaces as an
  // unhandledrejection rather than as the throw the hook is waiting on.
  const service = codeOnly(
    methodBody(source, 'async setLanguage(language: Language): Promise<void> {\n    // allSettled')
  );
  check('the service-level setLanguage exists', service.length > 0);
  check('both channels are settled before reporting', service.includes('Promise.allSettled'));

  // The hook that drives all of the above needs the same guard, one layer up. The service
  // abandons a superseded switch, which resolves it here as a *success* - so without this, a
  // switch the user has already moved off clears the warning raised by the one that replaced it
  // and re-enables the trigger while that one is still reconnecting.
  const hook = codeOnly(
    readSource(new URL('../src/renderer/hooks/use-interview-language.ts', import.meta.url))
  );
  check('the hook takes a generation per switch', /const seq = \+\+switchSeq\.current;/.test(hook));
  check(
    'it is taken before the config write is awaited',
    hook.indexOf('++switchSeq.current') < hook.indexOf('await updateConfig')
  );
  check(
    'a superseded switch reports neither success nor failure',
    (hook.match(/seq !== switchSeq\.current\) return;/g) ?? []).length === 2
  );
  check(
    'and leaves the spinner to the switch that replaced it',
    /if \(seq === switchSeq\.current\) setSwitching\(false\);/.test(hook)
  );

  // Its sibling has the identical shape and the identical race - `micSwitchSeq` abandons a
  // superseded swap in the service, and the hook has to stop reporting on it here.
  const deviceHook = codeOnly(
    readSource(new URL('../src/renderer/hooks/use-audio-input-device.ts', import.meta.url))
  );
  check(
    'the microphone hook takes the same guard',
    /const seq = \+\+switchSeq\.current;/.test(deviceHook) &&
      (deviceHook.match(/seq !== switchSeq\.current\) return;/g) ?? []).length === 2
  );

  // English is sent as no parameter at all, so a session in the default language stays
  // byte-identical to what every client released before the picker existed sends. The same is
  // true of a live session's channel count, which is the parameter's own default - between them
  // the whole query string is absent for the ordinary case.
  const url = codeOnly(methodBody(source, 'function buildStreamingUrl('));
  check(
    'the default language is sent as no query parameter',
    /language !== DEFAULT_LANGUAGE\) params\.set\('language'/.test(url)
  );
  check(
    'and neither is the default channel count',
    /channels !== LIVE_STREAM_CHANNELS\) params\.set\('channels'/.test(url)
  );
  check(
    'so an English live session sends a bare URL',
    /return query \? .+ : STREAMING_URL;/.test(url)
  );

  return failures;
}
