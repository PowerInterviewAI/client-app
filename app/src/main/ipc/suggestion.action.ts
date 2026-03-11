import { ipcMain } from 'electron';

import { actionSuggestionService } from '../services/suggestion.action.service.js';

export function registerActionSuggestionHandlers() {
  ipcMain.handle('action-suggestion:clear', async () => {
    await actionSuggestionService.clear();
  });
  ipcMain.handle('action-suggestion:stop', async () => {
    await actionSuggestionService.stop();
  });
}
