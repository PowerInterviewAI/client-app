import { BrowserWindow, globalShortcut } from 'electron';

import { ZOOM_STEP } from './consts.js';
import { actionSuggestionService } from './services/suggestion.action.service.js';
import {
  moveWindowByArrow,
  moveWindowToCorner,
  resizeWindowByArrow,
  toggleOpacity,
  toggleStealth,
  WindowPosition,
} from './services/window-control.service.js';
import * as zoomService from './services/zoom.service.js';

/**
 * Register global hotkeys for window management and navigation
 */
export function registerGlobalHotkeys(): void {
  // Unregister existing hotkeys first
  globalShortcut.unregisterAll();

  // Stop assistant - Ctrl+Shift+Q
  globalShortcut.register('Control+Shift+Q', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) {
      w.webContents.send('hotkey-stop-assistant');
    }
  });

  // Stealth mode toggle - Ctrl+Shift+M
  globalShortcut.register('Control+Shift+M', () => toggleStealth());

  // Opacity toggle (Ctrl+Shift+N): toggle opacity when in stealth mode
  globalShortcut.register('Control+Shift+N', () => toggleOpacity());

  // Zoom hotkeys: Ctrl+Shift+= (zoom in), Ctrl+Shift+- (zoom out), Ctrl+Shift+0 (reset)
  globalShortcut.register('Control+Shift+=', () => {
    try {
      zoomService.adjustZoom(ZOOM_STEP);
    } catch (e) {
      console.warn('hotkey zoom in failed', e);
    }
  });
  globalShortcut.register('Control+Shift+-', () => {
    try {
      zoomService.adjustZoom(-ZOOM_STEP);
    } catch (e) {
      console.warn('hotkey zoom out failed', e);
    }
  });
  globalShortcut.register('Control+Shift+0', () => {
    try {
      zoomService.resetZoom();
    } catch (e) {
      console.warn('hotkey zoom reset failed', e);
    }
  });

  // Window positioning hotkeys (Ctrl+Shift+1-9)
  // Map numpad-style positions: 7 8 9
  //                             4 5 6
  //                             1 2 3
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
    // Register Ctrl+Shift+1..9 for placement
    globalShortcut.register(`Control+Shift+${i}`, () => {
      const pos = numToCorner(i);
      moveWindowToCorner(pos);
    });
  }

  // Window movement hotkeys: Ctrl+Alt+Shift+Arrow
  globalShortcut.register('Control+Alt+Shift+Up', () => moveWindowByArrow('up'));
  globalShortcut.register('Control+Alt+Shift+Down', () => moveWindowByArrow('down'));
  globalShortcut.register('Control+Alt+Shift+Left', () => moveWindowByArrow('left'));
  globalShortcut.register('Control+Alt+Shift+Right', () => moveWindowByArrow('right'));

  // Resize window hotkeys: Ctrl+Win+Shift+Arrow (Super = Windows key)
  globalShortcut.register('Control+Super+Shift+Up', () => resizeWindowByArrow('up'));
  globalShortcut.register('Control+Super+Shift+Down', () => resizeWindowByArrow('down'));
  globalShortcut.register('Control+Super+Shift+Right', () => resizeWindowByArrow('right'));
  globalShortcut.register('Control+Super+Shift+Left', () => resizeWindowByArrow('left'));

  // Scroll live suggestions: Ctrl+Shift+K (up) / Ctrl+Shift+J (down) / Ctrl+Shift+L (end)
  globalShortcut.register('Control+Shift+K', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey-scroll', '0', 'up');
  });
  globalShortcut.register('Control+Shift+J', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey-scroll', '0', 'down');
  });
  globalShortcut.register('Control+Shift+L', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey-scroll', '0', 'end');
  });

  // Scroll action suggestions: Ctrl+Shift+I (up) / Ctrl+Shift+U (down) / Ctrl+Shift+O (end)
  globalShortcut.register('Control+Shift+I', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey-scroll', '1', 'up');
  });
  globalShortcut.register('Control+Shift+U', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey-scroll', '1', 'down');
  });
  globalShortcut.register('Control+Shift+O', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && !w.isDestroyed()) w.webContents.send('hotkey-scroll', '1', 'end');
  });

  // Action suggestion operations:
  // F9  - Capture screenshot
  // F10 - Clear captures
  // F11 - Trigger suggestion (no additional screenshot)
  // F12 - Capture then trigger
  globalShortcut.register('Control+Shift+F9', async () => {
    await actionSuggestionService.captureScreenshot();
  });
  globalShortcut.register('Control+Shift+F10', async () => {
    await actionSuggestionService.clearImages();
  });
  globalShortcut.register('Control+Shift+F11', async () => {
    await actionSuggestionService.startGenerateSuggestion();
  });
  globalShortcut.register('Control+Shift+F12', async () => {
    try {
      // only take a new screenshot when there are no existing uploads
      if (!actionSuggestionService.hasUploadedImages()) {
        await actionSuggestionService.captureScreenshot();
      }
    } catch (err) {
      // capture failed; log and continue to attempt suggestion if there are any images
      console.error('[Hotkeys] capture+submit: screenshot error', err);
    }
    await actionSuggestionService.startGenerateSuggestion();
  });

  console.log('🎹 Global hotkeys registered:');
  console.log('  Ctrl+Shift+= : Zoom in');
  console.log('  Ctrl+Shift+- : Zoom out');
  console.log('  Ctrl+Shift+0 : Reset zoom');
  console.log('  Ctrl+Shift+Q: Stop assistant');
  console.log('  Ctrl+Shift+M: Toggle stealth mode');
  console.log('  Ctrl+Shift+N: Toggle opacity (stealth only)');
  console.log('  Ctrl+Shift+1-9: Place window (numpad layout)');
  console.log('  Ctrl+Alt+Shift+Arrow: Move window');
  console.log('  Ctrl+Win+Shift+Arrow: Resize window');
  console.log('  Ctrl+Shift+J / K / L: Scroll interview suggestions (J down, K up, L end)');
  console.log('  Ctrl+Shift+U / I / O: Scroll action suggestions (U down, I up, O end)');
  console.log('  Ctrl+Shift+F9: Capture screenshot for triggered suggestion');
  console.log('  Ctrl+Shift+F10: Clear captured screenshots');
  console.log('  Ctrl+Shift+F11: Trigger suggestion (no screenshot)');
  console.log('  Ctrl+Shift+F12: Capture + trigger suggestion (combo)');
}

/**
 * Unregister all global hotkeys
 */
export function unregisterHotkeys(): void {
  globalShortcut.unregisterAll();
}
