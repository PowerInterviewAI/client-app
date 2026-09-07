/**
 * `mock-transcription.service.ts` must never capture loopback audio and must never write into
 * the live transcript pipeline. Both are silent failures if they regress: capturing loopback
 * would feed the interviewer's own TTS voice back in as "interviewer audio", reopening exactly
 * the acoustic-feedback problem the transmit gate exists to solve, through a second door; and
 * calling `transcription.ingest` would put a practice answer into `appState.transcripts`, flip
 * `hasHistory`, and fire a live suggestion (and its cost) for an answer nobody asked the live
 * assistant to hear.
 *
 * Source-level, the same reason `audio-device-switch.test.mjs` is: renderer code with no runtime
 * harness here.
 */
import { codeOnly, createChecker, readSource } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('mock-transcription-isolation');

  const raw = readSource(
    new URL('../src/renderer/services/mock-transcription.service.ts', import.meta.url)
  );
  const source = codeOnly(raw);

  check('never opens the loopback display capture', !source.includes('getDisplayMedia'));
  check('never enables the loopback IPC bridge', !source.includes('enableLoopbackAudio'));
  check(
    'never calls the live transcription ingest channel',
    !source.includes('transcription.ingest')
  );
  check('never starts the live transcription IPC session', !source.includes('transcription.start'));

  // The one channel it is allowed to touch is the shared auth-token setter - not session-specific
  // state, just where the ASR relay reads its Bearer token from.
  check(
    'still sets the session token for the ASR relay',
    source.includes('transcription.setSessionToken')
  );

  // Ingests through the mock-specific channel instead.
  check(
    'ingests through mockInterview.ingestAnswer',
    source.includes('electron.mockInterview.ingestAnswer')
  );

  // Exactly one AudioWsStream, on ch_1 (mic) - never ch_0 (loopback).
  const channelConstructions = [...source.matchAll(/new AudioWsStream\(/g)];
  check('constructs exactly one AudioWsStream', channelConstructions.length === 1);
  check("that channel is 'ch_1'", source.includes("new AudioWsStream('ch_1'"));
  check("it never constructs a 'ch_0' channel", !source.includes("'ch_0'"));

  // Composes the existing class rather than reimplementing capture - reusing AudioWsStream is
  // what keeps its switchSeq/setStream race guards untouched by this file entirely.
  check(
    'imports AudioWsStream from the live service rather than duplicating it',
    source.includes("from './live-transcription.service'") && source.includes('AudioWsStream')
  );

  return failures;
}
