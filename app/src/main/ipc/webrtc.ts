import { ipcMain } from 'electron';

import { webRtcService } from '../services/webrtc.service.js';

export function registerWebRTCHandlers() {
  ipcMain.handle('webrtc:offer', async (_event, offer) => {
    return await webRtcService.offer(offer);
  });

  ipcMain.handle('webrtc:turn-credentials', async () => {
    return await webRtcService.getTurnCredentials();
  });

  ipcMain.handle('webrtc:start-agents', async () => {
    await webRtcService.startAgents();
  });

  ipcMain.handle('webrtc:stop-agents', async () => {
    await webRtcService.stopAgents();
  });

  ipcMain.handle('webrtc:restart-audio-agent', async (_event, delayMs?: number) => {
    await webRtcService.restartAudioAgent(delayMs);
  });

  ipcMain.handle('webrtc:put-video-frame', async (_event, frameData: ArrayBuffer) => {
    await webRtcService.putVideoFrame(frameData);
  });
}
