import { ipcMain } from 'electron';
import {
  disableLoopbackAudio,
  enableLoopbackAudio,
  initMain as initAudioLoopback,
} from 'electron-audio-loopback';

import { transcriptService } from '../services/transcript.service.js';

let loopbackInitialized = false;

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
  ipcMain.handle('transcription:loopback-enable', async () => {
    await enableLoopbackAudio();
  });
  ipcMain.handle('transcription:loopback-disable', async () => {
    await disableLoopbackAudio();
  });
}
