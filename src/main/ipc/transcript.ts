import { BrowserWindow, dialog, ipcMain, session, shell, systemPreferences } from 'electron';
import loopbackPkg from 'electron-audio-loopback';

import { BACKEND_BASE_URL } from '../consts.js';
import { transcriptService } from '../services/transcript.service.js';

let loopbackInitialized = false;
const { initMain: initAudioLoopback } = loopbackPkg;

export function initializeAudioLoopback() {
  if (loopbackInitialized) return;
  initAudioLoopback();
  loopbackInitialized = true;
}

const PERMISSION_SETTINGS: Record<
  'screen-recording' | 'microphone',
  { label: string; settingsUrl: string }
> = {
  'screen-recording': {
    label: 'Screen Recording',
    settingsUrl:
      'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture',
  },
  microphone: {
    label: 'Microphone',
    settingsUrl:
      'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone',
  },
};

export function registerPermissionHandlers() {
  ipcMain.handle('permissions:check-screen-recording', () => {
    if (process.platform !== 'darwin') return 'granted';
    return systemPreferences.getMediaAccessStatus('screen');
  });

  // macOS has no askForMediaAccess('screen') — screen recording permission can only be
  // triggered by the OS when getDisplayMedia() is called from the renderer.
  // Mic and camera can be explicitly requested via askForMediaAccess.

  ipcMain.handle('permissions:check-microphone', () => {
    if (process.platform !== 'darwin') return 'granted';
    return systemPreferences.getMediaAccessStatus('microphone');
  });

  ipcMain.handle('permissions:request-microphone', async () => {
    if (process.platform !== 'darwin') return true;
    return systemPreferences.askForMediaAccess('microphone');
  });

  ipcMain.handle(
    'permissions:show-denied-dialog',
    async (_event, type: 'screen-recording' | 'microphone') => {
      if (process.platform !== 'darwin') return;
      const { label, settingsUrl } = PERMISSION_SETTINGS[type];
      const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
      const { response } = await dialog.showMessageBox(win, {
        type: 'warning',
        title: `${label} Permission Required`,
        message: `Power Interview AI needs ${label} access`,
        detail: `Open System Settings to grant ${label} permission, then restart the app.`,
        buttons: ['Open Settings', 'Cancel'],
        defaultId: 0,
        cancelId: 1,
      });
      if (response === 0) {
        await shell.openExternal(settingsUrl);
      }
    }
  );
}

export function registerTranscriptHandlers() {
  ipcMain.handle('transcription:clear', async () => {
    transcriptService.clear();
  });
  ipcMain.handle('transcription:start', async () => {
    await transcriptService.start();
  });
  ipcMain.handle('transcription:stop', async () => {
    await transcriptService.stop();
  });
  ipcMain.handle('transcription:ingest', async (_event, payload) => {
    await transcriptService.ingest(payload?.channel, payload?.type, payload?.text);
  });
  ipcMain.handle('transcription:set-session-token', async (_event, sessionToken: string) => {
    if (!sessionToken) return;
    const url = BACKEND_BASE_URL.replace(/^ws/i, 'http');
    const isSecure = url.startsWith('https://');
    await session.defaultSession.cookies.set({
      url,
      name: 'session_token',
      value: sessionToken,
      secure: isSecure,
      httpOnly: false,
      sameSite: isSecure ? 'no_restriction' : 'lax',
      path: '/',
    });
  });
}
