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
}
