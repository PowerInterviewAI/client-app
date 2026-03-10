import { ipcMain } from 'electron';

import { toolsService } from '../services/tools.service.js';

export function registerToolsHandlers() {
  ipcMain.handle('tools:export-transcript', async () => {
    await toolsService.exportTranscript();
  });
  ipcMain.handle('tools:clear-all', async () => {
    await toolsService.clearAll();
  });
  ipcMain.handle('tools:set-placeholder-data', async () => {
    await toolsService.setPlaceholderData();
  });
}
