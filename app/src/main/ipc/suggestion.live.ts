import { ipcMain } from 'electron';

import { liveSuggestionService } from '../services/suggestion.live.service.js';

export function registerLiveSuggestionHandlers() {
  ipcMain.handle('live-suggestion:clear', async () => {
    await liveSuggestionService.clear();
  });
  ipcMain.handle('live-suggestion:stop', async () => {
    await liveSuggestionService.stop();
  });
}
