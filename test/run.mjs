/**
 * Main-process checks. Run with `pnpm test:main` (builds electron-dist first).
 *
 * Deliberately dependency-free: these cover a couple of invariants that fail silently in
 * production (losing a not-yet-migrated CV, shipping one over IPC on a timer) and are not worth
 * pulling a test framework in for. Requires Node >= 22.15 for `module.registerHooks`.
 */
import fs from 'node:fs';

import { stubElectron } from './helpers.mjs';

// Must run before any module under test is imported.
const userDataDir = stubElectron();

const failures = [];
for (const module of [
  './config-store.test.mjs',
  // After config-store: that one seeds the store file and asserts on the leftover pre-sync
  // config, and this one writes to the same store.
  './language.test.mjs',
  './app-state.test.mjs',
  './account.test.mjs',
  './stealth-surface.test.mjs',
  './stealth-toggle.test.mjs',
  './stealth-dock.test.mjs',
  // After the stealth tests: it drives the shared appStateService singleton, and the dock test
  // reads the same running state through its own copy of window-control.
  './running-surface.test.mjs',
  './tools-export.test.mjs',
  './mock-export.test.mjs',
  // After tools-export: it drives the shared appStateService singleton through the placeholder
  // and back, which the export helpers above do not read.
  './save-history.test.mjs',
  // Drives mockInterviewService through a real session via a fake global fetch - after
  // save-history, which is the last test to depend on appStateService's placeholder state.
  './mock-interview-state.test.mjs',
  // Same harness and the same shared service singleton, so it follows the state machine's own
  // file rather than running beside it.
  './mock-live-hint.test.mjs',
  // Drives appStateService.runningState and mockInterview together, so it must run after
  // mock-interview-state seeds no lasting mockInterview state of its own (mock-interview-state
  // clears the service on every branch, and the service's own clear() resets appState too).
  './mock-action-suggestion-block.test.mjs',
  './mock-interview-gate.test.mjs',
  './mock-transcription-isolation.test.mjs',
  './mock-transcript-turns.test.mjs',
  './mock-tts-playback.test.mjs',
  './mock-session-scroll.test.mjs',
  './speech-chunks.test.mjs',
  './audio-device-switch.test.mjs',
  './language-switch.test.mjs',
  './rtl-rendering.test.mjs',
  './interviewer-turn.test.mjs',
  './transcript-merge.test.mjs',
  './transcript-turn-selection.test.mjs',
  './suggestion-sentinel.test.mjs',
  './suggestion-emphasis.test.mjs',
  './suggestion-truncate.test.mjs',
  './navigation-guard.test.mjs',
  './mac-update-util.test.mjs',
  './change-password.test.mjs',
  './password-reset.test.mjs',
]) {
  const { run } = await import(module);
  failures.push(...(await run(userDataDir)));
}

fs.rmSync(userDataDir, { recursive: true, force: true });

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('\nAll checks passed.');
