/**
 * Auto-Updater IPC Handlers
 * Handles communication between renderer and auto-updater service
 */

import { ipcMain } from 'electron';

import { autoUpdaterService } from '../services/auto-updater.service.js';

/**
 * Register auto-updater IPC handlers
 */
export function registerAutoUpdaterHandlers(): void {
  // Check for updates
  ipcMain.handle('auto-updater:check-for-updates', async () => {
    try {
      await autoUpdaterService.checkForUpdates();
      return { success: true };
    } catch (error) {
      console.error('[IPC] Failed to check for updates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Quit and install update
  ipcMain.handle('auto-updater:quit-and-install', () => {
    try {
      autoUpdaterService.quitAndInstall();
      return { success: true };
    } catch (error) {
      console.error('[IPC] Failed to quit and install:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get current version
  ipcMain.handle('auto-updater:get-version', () => {
    try {
      return {
        success: true,
        version: autoUpdaterService.getCurrentVersion(),
      };
    } catch (error) {
      console.error('[IPC] Failed to get version:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}
