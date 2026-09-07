/**
 * The transmit gate in `mock-tts.service.ts` is renderer code with no runtime harness here, the
 * same reason `audio-device-switch.test.mjs` is source-level. The ordering it pins is what keeps
 * a stranded mic mute impossible: acquire before play, release in a `finally` so every exit path
 * reaches it, a watchdog armed at acquire and cleared at release, and a generation check that
 * stops a superseded release from reopening a newer acquisition's gate.
 */
import { codeOnly, createChecker, methodBody, readSource } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('mock-interview-gate');

  const source = readSource(
    new URL('../src/renderer/services/mock-tts.service.ts', import.meta.url)
  );

  const acquireBody = methodBody(source, 'acquire(): number {');
  const releaseBody = methodBody(source, 'release(mySeq: number): void {');
  const forceReleaseBody = methodBody(source, 'forceReleaseNow(): void {');
  const playQuestionBody = methodBody(
    source,
    'async playQuestion(chunks: string[]): Promise<void> {'
  );
  const playBlobBody = methodBody(source, 'private playBlob(blob: Blob): Promise<void> {');

  check('MicGate.acquire exists', acquireBody.length > 0);
  check('MicGate.release exists', releaseBody.length > 0);
  check('MicGate.forceReleaseNow exists', forceReleaseBody.length > 0);
  check('playQuestion exists', playQuestionBody.length > 0);
  check('playBlob exists', playBlobBody.length > 0);

  // The mechanism: mute before play, not after.
  const acquireCall = playQuestionBody.indexOf('this.gate.acquire()');
  const loopStart = playQuestionBody.indexOf('for (let i = 0');
  check(
    'the gate is acquired before the playback loop starts',
    acquireCall !== -1 && acquireCall < loopStart
  );
  check('playBlob actually calls play()', playBlobBody.includes('audio.play()'));

  // The release is unconditional: it must be inside playQuestion's own finally, not only on the
  // success path, so a synthesis failure, a decode error, or a superseding stop() all reach it.
  const finallyIndex = playQuestionBody.lastIndexOf('finally {');
  const releaseCall = playQuestionBody.lastIndexOf('this.gate.release(mySeq)');
  check('playQuestion has a finally block', finallyIndex !== -1);
  check('the release call is inside it', releaseCall !== -1 && releaseCall > finallyIndex);

  // The watchdog: armed the moment the mic is muted, covering an HTMLAudioElement that never
  // fires `ended` or `error` - the one case the finally above cannot reach because nothing ever
  // resolves the playBlob promise it is waiting on.
  const muteCall = acquireBody.indexOf('this.track.enabled = false');
  const watchdogArm = acquireBody.indexOf('this.watchdogTimer = window.setTimeout');
  check('acquire mutes the track', muteCall !== -1);
  check('acquire arms the watchdog', watchdogArm !== -1);
  check('the watchdog is armed after muting', muteCall < watchdogArm);

  const watchdogClear = releaseBody.indexOf('window.clearTimeout(this.watchdogTimer)');
  check('release clears the watchdog', watchdogClear !== -1);

  // The generation token: a release presenting a stale token must not reopen a newer
  // acquisition's gate. This is what makes a late `ended` from a superseded utterance harmless.
  const staleGuard = releaseBody.indexOf('if (mySeq !== this.seq) return;');
  const unmuteCall = releaseBody.indexOf('this.track.enabled = true');
  check('release checks the token', staleGuard !== -1);
  check('the stale-token check precedes the unmute', staleGuard !== -1 && staleGuard < unmuteCall);

  // forceReleaseNow bumps the token itself, so anything already in flight for the old token is
  // invalidated - this is the state-driven belt use-mock-interview.ts calls.
  check(
    'forceReleaseNow invalidates the current token before opening the mic',
    codeOnly(forceReleaseBody).indexOf('this.seq += 1') <
      codeOnly(forceReleaseBody).indexOf('this.track.enabled = true')
  );

  // stop() must abort in-flight playback (bumping playSeq so the loop's own checks return) as
  // well as forcing the gate open - releasing the gate alone would leave the audio element
  // playing with the mic back on, which is not a fix.
  const stopBody = methodBody(source, 'stop(): void {');
  check('stop exists', stopBody.length > 0);
  check('stop supersedes the playback loop', stopBody.includes('this.playSeq += 1'));
  check('stop forces the gate open', stopBody.includes('this.gate.forceReleaseNow()'));

  return failures;
}
