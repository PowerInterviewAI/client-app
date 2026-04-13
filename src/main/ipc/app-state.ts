/**
 * App state IPC handlers
 */

import { ipcMain } from 'electron';

import { appStateService } from '../services/app-state.service.js';

export function registerAppStateHandlers(): void {
  // Get current app state
  ipcMain.handle('app:get-state', async () => {
    return appStateService.getState();
  });

  // Update app state
  ipcMain.handle('app:update-state', async (_event, updates) => {
    appStateService.updateState(updates);
    return appStateService.getState();
  });
}
