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

  // Retry the initial pull when it failed at startup (offline, backend down)
  ipcMain.handle('account:refresh', async () => {
    return accountService.pullFromBackend();
  });

  // Full config for the configuration dialog; kept out of the app-state broadcast because
  // the profile and context can run to hundreds of KB.
  ipcMain.handle('account:get', async () => {
    return accountService.getEditableConfig();
  });

  // Records that the first-run wizard is finished or skipped. On the account rather than local
  // config, so it follows the user across machines.
  ipcMain.handle('account:set-onboarding-completed', async (_event, completed: boolean) => {
    return accountService.setOnboardingCompleted(completed);
  });
}
