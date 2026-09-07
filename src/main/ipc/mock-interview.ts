import { ipcMain } from 'electron';

import { mockInterviewService } from '../services/mock-interview.service.js';
import { MockInterviewSetup } from '../types/mock-interview.js';

export function registerMockInterviewHandlers(): void {
  ipcMain.handle('mock-interview:start', async (_event, setup: MockInterviewSetup) => {
    await mockInterviewService.start(setup);
  });

  ipcMain.handle('mock-interview:synthesize-chunk', async (_event, index: number) => {
    return mockInterviewService.synthesizeChunk(index);
  });

  ipcMain.handle('mock-interview:speech-finished', async () => {
    await mockInterviewService.speechFinished();
  });

  ipcMain.handle('mock-interview:speech-failed', async () => {
    await mockInterviewService.speechFailed();
  });

  ipcMain.handle(
    'mock-interview:ingest-answer',
    async (_event, payload: { type: 'partial' | 'final'; text: string }) => {
      mockInterviewService.ingestAnswer(payload.type, payload.text);
    }
  );

  ipcMain.handle('mock-interview:answer-finished', async () => {
    await mockInterviewService.answerFinished();
  });

  ipcMain.handle('mock-interview:repeat-question', async () => {
    mockInterviewService.repeatQuestion();
  });

  ipcMain.handle('mock-interview:answer-ready', async () => {
    mockInterviewService.answerReady();
  });

  ipcMain.handle('mock-interview:skip-question', async () => {
    await mockInterviewService.skipQuestion();
  });

  ipcMain.handle('mock-interview:end-session', async () => {
    await mockInterviewService.endSession();
  });

  ipcMain.handle('mock-interview:clear', async () => {
    mockInterviewService.clear();
  });
}
