import { BrowserWindow, globalShortcut } from 'electron';

import { ZOOM_STEP } from './consts.js';
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

const isMac = process.platform === 'darwin';

// Base modifier: macOS uses Control+Option (less likely to conflict with system shortcuts)
// Windows/Linux use Control+Shift
const BASE = isMac ? 'Control+Alt' : 'Control+Shift';

/**
 * Register global hotkeys for window management and navigation
 */
export function registerGlobalHotkeys(): void {
  // Unregister existing hotkeys first
  globalShortcut.unregisterAll();

  // Stop assistant
  globalShortcut.register(`${BASE}+Q`, () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) {
      w.webContents.send('hotkey:stop-assistant');
    }
  });

  // Stealth mode toggle
  globalShortcut.register(`${BASE}+M`, () => toggleStealth());

  // Opacity toggle: cycle opacity when in stealth mode
  globalShortcut.register(`${BASE}+N`, () => toggleOpacity());

  // Zoom hotkeys
  globalShortcut.register(`${BASE}+=`, () => {
    try {
      zoomService.adjustZoom(ZOOM_STEP);
    } catch (e) {
      console.warn('hotkey zoom in failed', e);
    }
  });
  globalShortcut.register(`${BASE}+-`, () => {
    try {
      zoomService.adjustZoom(-ZOOM_STEP);
    } catch (e) {
      console.warn('hotkey zoom out failed', e);
    }
  });
  globalShortcut.register(`${BASE}+0`, () => {
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
      case '1': return 'bottom-left';
      case '2': return 'bottom-center';
      case '3': return 'bottom-right';
      case '4': return 'middle-left';
      case '5': return 'center';
      case '6': return 'middle-right';
      case '7': return 'top-left';
      case '8': return 'top-center';
      case '9': return 'top-right';
      default:  return 'center';
    }
  };

  for (let i = 1; i <= 9; i++) {
    globalShortcut.register(`${BASE}+${i}`, () => {
      moveWindowToCorner(numToCorner(i));
    });
  }

  // Window movement: Ctrl+Alt+Shift+Arrow (Alt = Option on macOS)
  globalShortcut.register('Control+Alt+Shift+Up', () => moveWindowByArrow('up'));
  globalShortcut.register('Control+Alt+Shift+Down', () => moveWindowByArrow('down'));
  globalShortcut.register('Control+Alt+Shift+Left', () => moveWindowByArrow('left'));
  globalShortcut.register('Control+Alt+Shift+Right', () => moveWindowByArrow('right'));

  // Window resize: macOS = Ctrl+Option+Command+Arrow, Windows = Ctrl+Win+Shift+Arrow
  const resizeMod = isMac ? 'Control+Alt+Super' : 'Control+Super+Shift';
  globalShortcut.register(`${resizeMod}+Up`, () => resizeWindowByArrow('up'));
  globalShortcut.register(`${resizeMod}+Down`, () => resizeWindowByArrow('down'));
  globalShortcut.register(`${resizeMod}+Right`, () => resizeWindowByArrow('right'));
  globalShortcut.register(`${resizeMod}+Left`, () => resizeWindowByArrow('left'));

  // Scroll live suggestions: J (down) / K (up) / L (end)
  globalShortcut.register(`${BASE}+K`, () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey:scroll', '0', 'up');
  });
  globalShortcut.register(`${BASE}+J`, () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey:scroll', '0', 'down');
  });
  globalShortcut.register(`${BASE}+L`, () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey:scroll', '0', 'end');
  });

  // Scroll action suggestions: I (up) / U (down) / O (end)
  globalShortcut.register(`${BASE}+I`, () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey:scroll', '1', 'up');
  });
  globalShortcut.register(`${BASE}+U`, () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey:scroll', '1', 'down');
  });
  globalShortcut.register(`${BASE}+O`, () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey:scroll', '1', 'end');
  });

  // Action suggestion operations
  globalShortcut.register(`${BASE}+F9`, async () => {
    await actionSuggestionService.captureScreenshot();
  });
  globalShortcut.register(`${BASE}+F10`, async () => {
    await actionSuggestionService.clearImages();
  });
  globalShortcut.register(`${BASE}+F11`, async () => {
    await actionSuggestionService.startGenerateSuggestion();
  });
  globalShortcut.register(`${BASE}+F12`, async () => {
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
  console.log(`  ${mod}+1-9 : Place window (numpad layout)`);
  console.log('  Ctrl+Alt+Shift+Arrow : Move window');
  console.log(isMac ? '  Ctrl+Opt+Cmd+Arrow : Resize window' : '  Ctrl+Win+Shift+Arrow : Resize window');
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
