import { BrowserWindow, globalShortcut } from 'electron';

import { ZOOM_STEP } from './consts.js';
import { appStateService } from './services/app-state.service.js';
import { mockInterviewService } from './services/mock-interview.service.js';
import { actionSuggestionService } from './services/suggestion-action.service.js';
import {
  moveWindowByArrow,
  moveWindowToCorner,
  resizeWindowByArrow,
  toggleOpacity,
  toggleStealth,
  WindowPosition,
} from './services/window-control.service.js';
import * as zoomService from './services/zoom.service.js';
import { isMockInterviewSessionActive } from './types/mock-interview.js';

const isMac = process.platform === 'darwin';

// Base modifier: macOS uses Control+Option (less likely to conflict with system shortcuts)
// Windows/Linux use Control+Shift
const BASE = isMac ? 'Control+Alt' : 'Control+Shift';

// globalShortcut.register() returns false rather than throwing when another application has
// already claimed the accelerator system-wide - a common combo like Ctrl+Shift+L is far more
// likely to lose that race than e.g. Ctrl+Shift+J, so without this check one binding can go
// dead with no trace while its neighbors keep working.
function registerShortcut(accelerator: string, callback: () => void): void {
  const ok = globalShortcut.register(accelerator, callback);
  if (!ok) {
    console.warn(
      `[Hotkeys] failed to register ${accelerator} - likely already claimed by another application`
    );
  }
}

/**
 * Register global hotkeys for window management and navigation
 */
export function registerGlobalHotkeys(): void {
  // Unregister existing hotkeys first
  globalShortcut.unregisterAll();

  // Stop assistant - or end the mock session, if one is running. There is deliberately no
  // *start* hotkey for either, so this is the only routing decision this shortcut needs: without
  // it, pressing it during a mock interview would run the live stop path against a session that
  // was never started (close to a no-op, but it still walks `runningState` through `Stopping`)
  // while doing nothing about the session actually on screen.
  registerShortcut(`${BASE}+Q`, () => {
    if (isMockInterviewSessionActive(appStateService.getState().mockInterview)) {
      void mockInterviewService.endSession();
      return;
    }
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) {
      w.webContents.send('hotkey:stop-assistant');
    }
  });

  // Stealth mode toggle
  registerShortcut(`${BASE}+M`, () => toggleStealth());

  // Opacity toggle: cycle opacity when in stealth mode
  registerShortcut(`${BASE}+N`, () => toggleOpacity());

  // Toggle the transcription dock. F8 rather than T because these shortcuts are system-wide, and
  // it keeps the dock reachable in stealth mode, where the control panel carrying the button is
  // hidden.
  registerShortcut(`${BASE}+F8`, () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey:toggle-transcript');
  });

  // Switch between hint-only and full-sentence suggestions. A function key for the same reason
  // as F8: it stays reachable in stealth mode, where the control panel carrying the button is
  // hidden. Deliberately not P - globalShortcut claims accelerators system-wide, and
  // Ctrl+Shift+P would take the command palette away from every editor on the machine for as
  // long as this app runs.
  registerShortcut(`${BASE}+F7`, () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey:toggle-suggestion-mode');
  });

  // Zoom hotkeys
  registerShortcut(`${BASE}+=`, () => {
    try {
      zoomService.adjustZoom(ZOOM_STEP);
    } catch (e) {
      console.warn('hotkey zoom in failed', e);
    }
  });
  registerShortcut(`${BASE}+-`, () => {
    try {
      zoomService.adjustZoom(-ZOOM_STEP);
    } catch (e) {
      console.warn('hotkey zoom out failed', e);
    }
  });
  registerShortcut(`${BASE}+0`, () => {
    try {
      zoomService.resetZoom();
    } catch (e) {
      console.warn('hotkey zoom reset failed', e);
    }
  });

  // Window positioning hotkeys (1-9 numpad layout)
  // 7 8 9
  // 4 5 6
  // 1 2 3
  const numToCorner = (n: number): WindowPosition => {
    switch (String(n)) {
      case '1':
        return 'bottom-left';
      case '2':
        return 'bottom-center';
      case '3':
        return 'bottom-right';
      case '4':
        return 'middle-left';
      case '5':
        return 'center';
      case '6':
        return 'middle-right';
      case '7':
        return 'top-left';
      case '8':
        return 'top-center';
      case '9':
        return 'top-right';
      default:
        return 'center';
    }
  };

  for (let i = 1; i <= 9; i++) {
    registerShortcut(`${BASE}+${i}`, () => {
      moveWindowToCorner(numToCorner(i));
    });
  }

  // Window movement: Ctrl+Alt+Shift+Arrow (Alt = Option on macOS)
  registerShortcut('Control+Alt+Shift+Up', () => moveWindowByArrow('up'));
  registerShortcut('Control+Alt+Shift+Down', () => moveWindowByArrow('down'));
  registerShortcut('Control+Alt+Shift+Left', () => moveWindowByArrow('left'));
  registerShortcut('Control+Alt+Shift+Right', () => moveWindowByArrow('right'));

  // Window resize: macOS = Ctrl+Option+Command+Arrow, Windows = Ctrl+Win+Shift+Arrow
  const resizeMod = isMac ? 'Control+Alt+Super' : 'Control+Super+Shift';
  registerShortcut(`${resizeMod}+Up`, () => resizeWindowByArrow('up'));
  registerShortcut(`${resizeMod}+Down`, () => resizeWindowByArrow('down'));
  registerShortcut(`${resizeMod}+Right`, () => resizeWindowByArrow('right'));
  registerShortcut(`${resizeMod}+Left`, () => resizeWindowByArrow('left'));

  // Scroll live suggestions: J (down) / K (up) / L (end)
  registerShortcut(`${BASE}+K`, () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey:scroll', '0', 'up');
  });
  registerShortcut(`${BASE}+J`, () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey:scroll', '0', 'down');
  });
  registerShortcut(`${BASE}+L`, () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey:scroll', '0', 'end');
  });

  // Scroll action suggestions: I (up) / U (down) / O (end)
  registerShortcut(`${BASE}+I`, () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey:scroll', '1', 'up');
  });
  registerShortcut(`${BASE}+U`, () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey:scroll', '1', 'down');
  });
  registerShortcut(`${BASE}+O`, () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey:scroll', '1', 'end');
  });

  // Action suggestion operations
  registerShortcut(`${BASE}+F9`, async () => {
    await actionSuggestionService.captureScreenshot();
  });
  registerShortcut(`${BASE}+F10`, async () => {
    await actionSuggestionService.clearImages();
  });
  registerShortcut(`${BASE}+F11`, async () => {
    await actionSuggestionService.startGenerateSuggestion();
  });
  registerShortcut(`${BASE}+F12`, async () => {
    try {
      if (!actionSuggestionService.hasUploadedImages()) {
        await actionSuggestionService.captureScreenshot();
      }
    } catch (err) {
      console.error('[Hotkeys] capture+submit: screenshot error', err);
    }
    await actionSuggestionService.startGenerateSuggestion();
  });

  const mod = isMac ? 'Ctrl+Opt' : 'Ctrl+Shift';
  console.log('🎹 Global hotkeys registered:');
  console.log(`  ${mod}+= / - / 0 : Zoom in / out / reset`);
  console.log(`  ${mod}+Q : Stop assistant`);
  console.log(`  ${mod}+M : Toggle stealth mode`);
  console.log(`  ${mod}+N : Toggle opacity (stealth only)`);
  console.log(`  ${mod}+F7 : Switch hint-only / full-sentence suggestions`);
  console.log(`  ${mod}+F8 : Toggle transcription dock`);
  console.log(`  ${mod}+1-9 : Place window (numpad layout)`);
  console.log('  Ctrl+Alt+Shift+Arrow : Move window');
  console.log(
    isMac ? '  Ctrl+Opt+Cmd+Arrow : Resize window' : '  Ctrl+Win+Shift+Arrow : Resize window'
  );
  console.log(`  ${mod}+J / K / L : Scroll live suggestions`);
  console.log(`  ${mod}+U / I / O : Scroll action suggestions`);
  console.log(`  ${mod}+F9/F10/F11/F12 : Capture / Clear / Trigger / Capture+Trigger`);
}

/**
 * Unregister all global hotkeys
 */
export function unregisterHotkeys(): void {
  globalShortcut.unregisterAll();
}
