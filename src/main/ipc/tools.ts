import { dialog, ipcMain } from 'electron';
import fs from 'fs/promises';

import { toolsService } from '../services/tools.service.js';

export function registerToolsHandlers(): void {
  ipcMain.handle('tools:export-transcript', async () => {
    return toolsService.exportTranscript();
  });
  ipcMain.handle('tools:clear-all', async () => {
    await toolsService.clearAll();
  });
  ipcMain.handle('tools:set-placeholder-data', async () => {
    await toolsService.setPlaceholderData();
  });
  ipcMain.handle(
    'tools:save-image',
    async (_event, { filename, data }: { filename: string; data: number[] }) => {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Save Image',
        defaultPath: filename,
        filters: [{ name: 'PNG Image', extensions: ['png'] }],
      });
      if (canceled || !filePath) return { filePath: null };
      await fs.writeFile(filePath, Buffer.from(data));
      return { filePath };
    }
  );
}
