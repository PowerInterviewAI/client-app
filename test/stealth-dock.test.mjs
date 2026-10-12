/**
 * The macOS Dock icon is the counterpart of the Windows taskbar button: present in normal mode,
 * gone in stealth. It has a failure mode the taskbar button does not - macOS drops a Dock call
 * made within a second of the previous one, silently, so toggling stealth a few times in quick
 * succession could leave the icon sitting on screen during a shared call with nothing logged.
 *
 * These branches read `process.platform` at module scope, so they are dead code on the Linux
 * runner CI uses. `loadMainAs('darwin', ...)` loads a second instance that believes it is on
 * macOS, and the electron stub records every Dock and activation-policy call in order.
 */
import { createChecker, loadMainAs } from './helpers.mjs';

/** Last state the Dock was actually asked for, ignoring the activation-policy entries. */
function dockState(calls) {
  for (let i = calls.length - 1; i >= 0; i--) {
    if (calls[i] === 'dock.show') return 'visible';
    if (calls[i] === 'dock.hide') return 'hidden';
  }
  return 'untouched';
}

/** Both halves have to agree - the policy is what moves the app, the Dock call clears the icon. */
function surfaceIs(calls, expected) {
  const policy = calls.filter((c) => c === 'regular' || c === 'accessory').at(-1);
  return expected === 'visible'
    ? dockState(calls) === 'visible' && policy === 'regular'
    : dockState(calls) === 'hidden' && policy === 'accessory';
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function run() {
  const { check, failures } = createChecker('stealth-dock');

  const { app } = await import('electron');
  const windowControl = await loadMainAs('darwin', 'services/window-control.service.js');

  const calls = app.dockCalls;
  const skipTaskbar = [];
  const windowButtonVisible = [];
  const handlers = {};
  windowControl.setWindowReference({
    isDestroyed: () => false,
    on: (event, handler) => {
      handlers[event] = handler;
    },
    setAlwaysOnTop: () => {},
    setSkipTaskbar: (skip) => skipTaskbar.push(skip),
    setWindowButtonVisibility: (visible) => windowButtonVisible.push(visible),
    setVisibleOnAllWorkspaces: () => {},
    setIgnoreMouseEvents: () => {},
    setFocusable: () => {},
    setOpacity: () => {},
    isMinimized: () => false,
    isVisible: () => true,
    show: () => {},
    showInactive: () => {},
    focus: () => {},
    restore: () => {},
    webContents: { send: () => {} },
  });

  check('the app starts with a Dock icon', surfaceIs(calls, 'visible'));
  check('the app starts with traffic lights visible', windowButtonVisible.at(-1) === true);

  // Five cycles back to back, all inside the one-second window, so every one of them hits the
  // rate limit. This is the sequence a user produces by mashing the stealth hotkey.
  for (let i = 0; i < 5; i++) {
    windowControl.enableStealth();
    check(
      `cycle ${i + 1}: entering stealth asks for the Dock icon to go`,
      surfaceIs(calls, 'hidden')
    );
    check(
      `cycle ${i + 1}: entering stealth hides the traffic lights`,
      windowButtonVisible.at(-1) === false
    );
    windowControl.disableStealth();
    check(
      `cycle ${i + 1}: leaving stealth asks for the Dock icon back`,
      surfaceIs(calls, 'visible')
    );
    check(
      `cycle ${i + 1}: leaving stealth shows the traffic lights again`,
      windowButtonVisible.at(-1) === true
    );
  }

  // Settling in stealth is the case that matters: a call macOS swallowed here leaves the icon up.
  windowControl.enableStealth();
  check('the last toggle asks for the Dock icon to go', surfaceIs(calls, 'hidden'));

  const beforeRecheck = calls.length;
  await wait(1300);
  check(
    'the swallowed Dock call is re-asserted once the rate limit passes',
    calls.length > beforeRecheck
  );
  check('and it settles hidden', surfaceIs(calls, 'hidden'));

  // Window events run through the same path. They must not spend the one-second budget that the
  // next real toggle needs, so a no-op has to stay a no-op.
  const beforeEvents = calls.length;
  skipTaskbar.length = 0;
  windowButtonVisible.length = 0;
  for (const event of ['show', 'restore', 'maximize', 'unmaximize']) handlers[event]?.();
  check('window events touch the Dock only when the state changed', calls.length === beforeEvents);
  check('window events still re-assert the taskbar button', skipTaskbar.at(-1) === true);
  check(
    'window events still re-assert the hidden traffic lights',
    windowButtonVisible.at(-1) === false
  );

  windowControl.disableStealth();
  check('leaving stealth asks for the Dock icon back', surfaceIs(calls, 'visible'));
  check('leaving stealth shows the traffic lights', windowButtonVisible.at(-1) === true);

  await wait(1300);
  check('it settles visible', surfaceIs(calls, 'visible'));

  // The re-assert must not re-arm itself, or the app would keep poking the Dock forever.
  const afterSettle = calls.length;
  await wait(1300);
  check('the re-assert stops once the state is stable', calls.length === afterSettle);
  check('and the Dock icon is still there', surfaceIs(calls, 'visible'));

  // The Dock icon follows a running assistant as well as stealth. The traffic lights deliberately
  // do not: a running window outside stealth is still focusable and interactive, so taking its
  // close and minimise buttons away would strand the user. This is the only test that runs as
  // darwin, so it is the only place either is reachable.
  //
  // The refresh is called directly rather than left to appStateService. That singleton is shared
  // with this copy of the module, but its own import of window-control carries no query string,
  // so its refresh drives the *default* instance - not this darwin one. That the state change
  // triggers a refresh at all is covered in running-surface.test.mjs.
  const { appStateService } = await import('../electron-dist/services/app-state.service.js');
  const { RunningState } = await import('../electron-dist/types/app-state.js');

  await wait(1300);
  windowButtonVisible.length = 0;
  windowControl.setHideTaskbarWhileRunning(true);
  appStateService.updateState({ runningState: RunningState.Running });
  windowControl.refreshWindowSurfaces();
  check('starting the assistant drops the Dock icon', surfaceIs(calls, 'hidden'));
  check(
    'starting the assistant leaves the traffic lights alone',
    windowButtonVisible.at(-1) === true
  );

  await wait(1300);
  appStateService.updateState({ runningState: RunningState.Idle });
  windowControl.refreshWindowSurfaces();
  check('stopping the assistant brings the Dock icon back', surfaceIs(calls, 'visible'));

  // With the setting off (the default) a running session leaves the Dock icon where it is.
  await wait(1300);
  windowControl.setHideTaskbarWhileRunning(false);
  const beforeOffRun = calls.length;
  appStateService.updateState({ runningState: RunningState.Running });
  windowControl.refreshWindowSurfaces();
  check(
    'setting off: running does not drop the Dock icon',
    !calls.slice(beforeOffRun).includes('dock.hide')
  );
  check('setting off: the Dock icon is still there', surfaceIs(calls, 'visible'));
  appStateService.updateState({ runningState: RunningState.Idle });
  windowControl.refreshWindowSurfaces();

  return failures;
}
