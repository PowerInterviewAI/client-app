import { dialog, ipcMain } from 'electron';
import fs from 'fs/promises';

import { toolsService } from '../services/tools.service.js';
import { ExportFormat } from '../types/export.js';
import { uiStrings } from '../utils/ui-strings.js';

export function registerToolsHandlers(): void {
  ipcMain.handle('tools:export-transcript', async (_event, format: ExportFormat = 'docx') => {
    return toolsService.exportTranscript(format);
  });
  ipcMain.handle('tools:export-mock-report', async (_event, format: ExportFormat = 'docx') => {
    return toolsService.exportMockReport(format);
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
      const strings = uiStrings();
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: strings.saveImageTitle,
        defaultPath: filename,
        filters: [{ name: strings.pngFilter, extensions: ['png'] }],
      });
      if (canceled || !filePath) return { filePath: null };
      await fs.writeFile(filePath, Buffer.from(data));
      return { filePath };
    }
  );
}
