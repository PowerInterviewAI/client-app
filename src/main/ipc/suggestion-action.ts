import { ipcMain } from 'electron';

import { actionSuggestionService } from '../services/suggestion-action.service.js';

export function registerActionSuggestionHandlers(): void {
  ipcMain.handle('action-suggestion:clear', async () => {
    await actionSuggestionService.clear();
  });
  ipcMain.handle('action-suggestion:stop', async () => {
    await actionSuggestionService.stop();
  });
  // Capture/clear-images/trigger previously reachable only via the Ctrl+Shift+F9-F11 hotkeys
  // (src/main/hotkeys.ts) - exposed here so the control bar can call the same service methods
  // instead of duplicating them.
  ipcMain.handle('action-suggestion:capture', async () => {
    await actionSuggestionService.captureScreenshot();
  });
  ipcMain.handle('action-suggestion:clear-images', async () => {
    await actionSuggestionService.clearImages();
  });
  ipcMain.handle('action-suggestion:trigger', async () => {
    await actionSuggestionService.startGenerateSuggestion();
  });
}
