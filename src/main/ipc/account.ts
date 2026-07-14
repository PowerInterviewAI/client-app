import { ipcMain } from 'electron';

import { accountService } from '../services/account.service.js';

export function registerAccountHandlers(): void {
  // Push local account config changes (full name, profile, context) to the backend
  ipcMain.handle(
    'account:update',
    async (_event, fullName: string, profileData: string, context: string) => {
      return accountService.updateConfig(fullName, profileData, context);
    }
  );
}
