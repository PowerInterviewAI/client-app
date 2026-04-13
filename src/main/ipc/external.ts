import { ipcMain, shell } from 'electron';

export function registerExternalHandlers(): void {
  ipcMain.handle('open-external', async (_event, url: string) => {
    try {
      if (!url || typeof url !== 'string') return { success: false, error: 'invalid-url' };
      await shell.openExternal(url);
      return { success: true };
      // eslint-disable-next-line
    } catch (err: any) {
      console.warn('open-external handler error:', err);
      return { success: false, error: String(err?.message || err) };
    }
  });
}
