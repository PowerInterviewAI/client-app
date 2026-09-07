import { app, BrowserWindow, ipcMain } from 'electron';

import { appStateService } from './services/app-state.service.js';
import { getWindowReference } from './services/window-control.service.js';

/**
 * Hold the window open long enough to ask whether the interview should be saved.
 *
 * Clear and Start are renderer-initiated and can ask before they act. Closing cannot: the
 * decision is taken in main, by the OS close button, Cmd+Q or `app.quit()`, and by the time the
 * renderer hears about it the answer would arrive too late to matter. So the close is vetoed,
 * the renderer is asked, and it closes the window itself once the user has answered.
 *
 * The transcript and the suggestions live only in main-process memory - nothing is written to
 * disk until an export - so a close taken at face value is the one path in this app that
 * destroys an interview with no way back.
 */

// The user has answered and the next close is theirs. Set immediately before we ask for it.
let closeConfirmed = false;

// A prompt is already on screen. A second close - the window button while the dialog is up, or
// a quit arriving behind it - must not stack another one on top of it.
let prompting = false;

// A quit is in flight. Vetoing the close aborts it, so confirming has to restart it rather than
// close the window, or Cmd+Q would leave a quitting app sitting there with one window less.
let quitting = false;

export function installCloseGuard(win: BrowserWindow): void {
  // This module's state outlives the window - the single-instance lock rebuilds one that was
  // destroyed - and a stale `closeConfirmed` would let the replacement close unasked.
  closeConfirmed = false;
  prompting = false;

  // A load replaces the renderer that was going to answer, so the question dies with it.
  // Without this the flag stays set and every later close is vetoed without a prompt being
  // sent: a window that cannot be closed at all.
  win.webContents.on('did-finish-load', () => {
    prompting = false;
  });

  win.on('close', (event) => {
    const state = appStateService.getState();
    if (closeConfirmed || !(state.hasHistory || state.hasMockContent)) return;

    // Nobody to ask. A renderer that has crashed or is already torn down would swallow the
    // prompt, and a window that cannot be closed is worse than one that closes unasked.
    const wc = win.webContents;
    if (wc.isDestroyed() || wc.isCrashed()) return;

    event.preventDefault();
    if (prompting) return;

    prompting = true;
    wc.send('app:save-history-prompt');
  });
}

/**
 * Let the next close through without asking, and put the guard back.
 *
 * For a quit that commits to something irreversible *before* it calls `app.quit()`.
 * `autoUpdater.quitAndInstall()` spawns the installer - and on macOS `shell.openPath` has
 * already opened the .dmg - and only then quits, so vetoing that quit does not cancel the
 * update. It leaves an installer running against an app that refuses to exit, which on Windows
 * ends with the installer killing it: the interview is lost anyway, and the prompt asking about
 * it was on screen for a second. The question belongs before the install starts, and the
 * renderer asks it there.
 */
export function allowNextClose(): void {
  closeConfirmed = true;
}

/** Re-arm after an `allowNextClose()` whose quit never happened. */
export function rearmCloseGuard(): void {
  closeConfirmed = false;
}

// Long enough for `app.quit()` to have emitted `before-quit`, which happens in the tick after
// the installer is spawned. Nothing waits on this, so being generous costs nothing.
const QUIT_GRACE_MS = 5_000;

/**
 * Re-arm unless the quit actually started.
 *
 * `autoUpdater.quitAndInstall()` reports nothing back when the install fails - it simply does
 * not quit - so this is the only way to notice that the app is still here. Left unchecked, one
 * failed update would disarm the guard for the rest of the session and the next close would
 * take the interview with it, silently, which is the whole thing this file exists to stop.
 *
 * `quitting` is the test rather than a window count, because re-arming a quit that *is* under
 * way would turn the guard into a veto of the close it had just approved.
 */
export function rearmCloseGuardIfStillRunning(): void {
  setTimeout(() => {
    if (!quitting) closeConfirmed = false;
  }, QUIT_GRACE_MS).unref();
}

export function registerCloseGuardHandlers(): void {
  app.on('before-quit', () => {
    quitting = true;
  });

  ipcMain.on('window:close-confirmed', () => {
    prompting = false;
    closeConfirmed = true;

    // `app.quit()` rather than `win.close()` when a quit was already under way: the veto
    // cancelled it, and closing the window alone would leave `will-quit` unrun on macOS, where
    // the app can outlive its windows.
    if (quitting) {
      app.quit();
      return;
    }

    const win = getWindowReference();
    if (win && !win.isDestroyed()) win.close();
  });

  ipcMain.on('window:close-cancelled', () => {
    prompting = false;
    // Reset, or the next Cmd+Q would take the quit branch above and quit a session the user
    // has just chosen to keep.
    quitting = false;
  });
}
