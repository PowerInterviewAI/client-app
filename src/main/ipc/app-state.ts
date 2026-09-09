/**
 * App state IPC handlers
 */

import { ipcMain } from 'electron';

import { appStateService } from '../services/app-state.service.js';
import { type AppState } from '../types/app-state.js';

/**
 * Fields the main process derives from the backend's authenticated ping, never from anything the
 * renderer sends. Without this, `app:update-state` passed a renderer-supplied `updates` object
 * straight through, and a balance or role written this way would live until the next ping (up to
 * `FAILURE_INTERVAL`/`SUCCESS_INTERVAL` later) silently overwrote it - an unguarded path onto a
 * financial field that happened to have no caller today.
 */
const SERVER_OWNED_KEYS = ['credits', 'creditsPerMinute', 'userRole', 'mockPricing'] as const;

function stripServerOwnedFields(updates: Partial<AppState>): Partial<AppState> {
  const sanitized = { ...updates };
  for (const key of SERVER_OWNED_KEYS) {
    delete sanitized[key];
  }
  return sanitized;
}

export function registerAppStateHandlers(): void {
  // Get current app state
  ipcMain.handle('app:get-state', async () => {
    return appStateService.getRendererState();
  });

  // Update app state
  ipcMain.handle('app:update-state', async (_event, updates: Partial<AppState>) => {
    appStateService.updateState(stripServerOwnedFields(updates));
    return appStateService.getRendererState();
  });
}
