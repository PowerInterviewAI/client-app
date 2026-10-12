/**
 * Everything that destroys the interview asks to save it first, and the question is only worth
 * asking about a real one. The panels are seeded with placeholder copy on launch and again
 * after every Clear, so `transcripts.length` is never zero and cannot be the test.
 *
 * `hasHistory` is what the prompt and the export guard both read. These pin that it follows the
 * writes rather than the array lengths, and that an export refuses the placeholder - which the
 * length check let through, producing a billed summary of "Transcripts will be here".
 */
import { codeOnly, createChecker, loadMain, readSource } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('save-history');

  const { appStateService } = await loadMain('services/app-state.service.js');
  const { toolsService } = await loadMain('services/tools.service.js');

  appStateService.setPlaceholderState();
  const placeholder = appStateService.getState();
  check(
    'the placeholder fills the panels',
    placeholder.transcripts.length > 0 && placeholder.liveSuggestions.length > 0
  );
  check('the placeholder is not history', placeholder.hasHistory === false);
  check('the renderer is told the same', appStateService.getRendererState().hasHistory === false);

  let exportError = null;
  try {
    await toolsService.exportTranscript('md');
  } catch (e) {
    exportError = e;
  }
  check('exporting the placeholder is refused', exportError !== null);
  check(
    'and says why rather than failing on the request',
    /nothing to export/i.test(exportError?.message ?? '')
  );

  // A real ingest writes one array. The other two still hold the placeholder at that moment, and
  // an interview carrying two lines of sample suggestion copy into an exported report is the
  // failure that shape produces.
  appStateService.updateState({
    transcripts: [
      { timestamp: 1, text: 'Tell me about a hard bug.', speaker: 'other', isFinal: true },
    ],
  });
  const real = appStateService.getState();
  check('a real transcript is history', real.hasHistory === true);
  check('the placeholder suggestions go with it', real.liveSuggestions.length === 0);
  check('so do the placeholder action suggestions', real.actionSuggestions.length === 0);

  // Clear empties all three; the flag has to come back down or the next Clear asks about
  // nothing, which is exactly the prompt fatigue that makes people stop reading it.
  appStateService.updateState({ transcripts: [] });
  appStateService.updateState({ liveSuggestions: [] });
  appStateService.updateState({ actionSuggestions: [] });
  check('clearing drops the flag', appStateService.getState().hasHistory === false);

  appStateService.updateState({
    liveSuggestions: [{ timestamp: 2, last_question: 'q', answer: 'a' }],
  });
  check('a suggestion alone is history too', appStateService.getState().hasHistory === true);

  // Action suggestions are not in the exported report - `exportTranscript` builds from
  // transcripts and live suggestions alone - so a session holding only a screenshot has nothing
  // a save could capture. Counting it would offer to save what the save cannot contain, and
  // would put a billed summarize call over an empty transcript back on the table.
  appStateService.updateState({ liveSuggestions: [] });
  appStateService.updateState({
    actionSuggestions: [{ timestamp: 3, last_question: 'q', answer: 'a', image_urls: [] }],
  });
  check(
    'a screenshot alone is not something a save could capture',
    appStateService.getState().hasHistory === false
  );

  let screenshotExportError = null;
  try {
    await toolsService.exportTranscript('md');
  } catch (e) {
    screenshotExportError = e;
  }
  check('and exporting it is refused rather than billed', screenshotExportError !== null);
  appStateService.updateState({ actionSuggestions: [] });

  // Derived in main and trusted by the close guard, so a caller must not be able to set it.
  // It reaches `updateState` inside a Partial<AppState> the renderer composes.
  appStateService.updateState({
    transcripts: [{ timestamp: 4, text: 'real', speaker: 'other', isFinal: true }],
  });
  appStateService.updateState({ hasHistory: false });
  check('an incoming hasHistory is ignored', appStateService.getState().hasHistory === true);
  appStateService.updateState({ transcripts: [] });
  appStateService.updateState({ hasHistory: true });
  check('in both directions', appStateService.getState().hasHistory === false);

  appStateService.setPlaceholderState();
  check(
    're-seeding the placeholder is not history again',
    appStateService.getState().hasHistory === false
  );

  // Source-level, like the renderer checks in this directory: the close is vetoed in main and
  // the window is only closed by the renderer's answer, so dropping either reply leaves an app
  // that cannot be closed at all. There is no runtime harness that would catch that.
  const guard = readSource(new URL('../src/main/window-close-guard.ts', import.meta.url));
  check('the close is vetoed', guard.includes('event.preventDefault()'));
  check('the renderer is asked', guard.includes("wc.send('app:save-history-prompt')"));
  // The prompt is rendered in the window, so a close arriving while it is minimized brings it back.
  check(
    'a minimized window is restored before it is asked',
    guard.indexOf('restoreWindow()') !== -1 &&
      guard.indexOf('restoreWindow()') < guard.indexOf("wc.send('app:save-history-prompt')")
  );
  check(
    'a confirmed close is not vetoed twice',
    guard.includes('if (closeConfirmed ||') && guard.includes('closeConfirmed = true')
  );
  check(
    'a quit that was vetoed is restarted rather than left half-done',
    guard.includes('if (quitting) {') && guard.includes('app.quit()')
  );
  check(
    'a crashed renderer cannot hold the window open',
    guard.includes('wc.isDestroyed() || wc.isCrashed()')
  );
  check(
    'a reload cannot strand the veto with nobody left to answer',
    guard.includes("win.webContents.on('did-finish-load'")
  );

  // The installer is launched *inside* quitAndInstall and the quit requested after it, so a
  // guard still armed at that point vetoes a quit the update has already committed to - leaving
  // an installer running against an app that will not exit. Source-level because driving
  // electron-updater in this harness is not something the stub can do.
  const updaterIpc = readSource(new URL('../src/main/ipc/auto-updater.ts', import.meta.url));
  check(
    'the updater disarms the close guard before installing',
    updaterIpc.indexOf('allowNextClose()') < updaterIpc.indexOf('quitAndInstall()')
  );
  check(
    'and re-arms it when nothing was launched',
    updaterIpc.includes('rearmCloseGuard();') && updaterIpc.includes('return { success: false };')
  );
  // electron-updater says nothing when an install fails - it simply does not quit - so without
  // this one failed update disarms the guard for the rest of the session and the next close
  // takes the interview with it.
  check(
    'and re-arms it when the install was started but never quit',
    updaterIpc.includes('rearmCloseGuardIfStillRunning();')
  );
  check(
    'the delayed re-arm stands down for a quit that did start',
    guard.includes('if (!quitting) closeConfirmed = false;')
  );

  const updateToast = readSource(
    new URL('../src/renderer/components/custom/update-notification.tsx', import.meta.url)
  );
  check(
    'the install asks about an unsaved interview first',
    updateToast.includes("useSaveHistoryPrompt.getState().prompt('update')")
  );
  check('and only installs when the answer is yes', updateToast.includes('if (!proceed) return;'));
  // Reading it off the subscribed app state would re-render this component - and re-arm its
  // status effect - on every ASR partial, to answer a question it only asks on a click.
  check(
    'and does not subscribe to the app state to find that out',
    !codeOnly(updateToast).includes('useSaveHistoryGuard') && updateToast.includes('appState.get()')
  );

  return failures;
}
