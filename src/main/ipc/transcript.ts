import { ipcMain, session } from 'electron';
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
