import { ipcMain } from 'electron';

import { appStateService } from '../services/app-state.service.js';
import { configStore, RuntimeConfig } from '../store/config.store.js';

export function registerConfigHandlers(): void {
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
      const config = configStore.updateConfig(updates);

      // The placeholder panel copy is written by main and only rewritten on launch and after a
      // Clear, so a chrome language changed between those two would leave English sample text in
      // the panels of an otherwise translated app. Keyed on the update rather than on the value
      // changing, which is enough: the re-seed is a no-op once a real interview has started.
      if (updates.uiLanguage !== undefined) appStateService.refreshPlaceholderLanguage();

      return config;
    } catch (error) {
      console.error('Failed to update config:', error);
      throw error;
    }
  });
}
