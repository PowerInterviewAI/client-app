import { ipcMain } from 'electron';
import loopbackPkg from 'electron-audio-loopback';

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
}
