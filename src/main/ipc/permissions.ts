import { ipcMain, shell, systemPreferences } from 'electron';

export function registerPermissionHandlers(): void {
  ipcMain.handle('permissions:check-all', () => {
    if (process.platform !== 'darwin') {
      return { mic: 'granted', screen: 'granted' };
    }
    return {
      mic: systemPreferences.getMediaAccessStatus('microphone'),
      screen: systemPreferences.getMediaAccessStatus('screen'),
    };
  });

  ipcMain.handle('permissions:request-microphone', async () => {
    if (process.platform !== 'darwin') return true;
    return systemPreferences.askForMediaAccess('microphone');
  });

  ipcMain.handle('permissions:open-settings', async (_event, pane: 'microphone' | 'screen') => {
    const urls: Record<string, string> = {
      microphone:
        'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone',
      screen:
        'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture',
    };
    if (urls[pane]) await shell.openExternal(urls[pane]).catch(() => {});
  });
}
