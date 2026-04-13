import { ipcMain } from 'electron';

import { configStore, RuntimeConfig } from '../store/config.store.js';

export function registerConfigHandlers() {
  // Handle config queries
  ipcMain.handle('config:get', async () => {
    try {
      return configStore.getConfig();
    } catch (error) {
      console.error('Failed to get config:', error);
      throw error;
    }
  });

  // Handle config updates
  ipcMain.handle('config:update', async (_event, updates: Partial<RuntimeConfig>) => {
    try {
      return configStore.updateConfig(updates);
    } catch (error) {
      console.error('Failed to update config:', error);
      throw error;
    }
  });
}
