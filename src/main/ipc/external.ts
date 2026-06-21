import { ipcMain, shell } from 'electron';

export function registerExternalHandlers(): void {
  ipcMain.handle('external:open', async (_event, url: string) => {
    try {
      if (!url || typeof url !== 'string') return { success: false, error: 'invalid-url' };
      await shell.openExternal(url);
      return { success: true };
    } catch (err: unknown) {
      console.warn('[ExternalHandlers] external:open error:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('external:open-file', async (_event, filePath: string) => {
    const err = await shell.openPath(filePath);
    return err ? { success: false, error: err } : { success: true };
  });

  ipcMain.handle('external:show-in-folder', (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });
}
