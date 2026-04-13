/**
 * Auth IPC Handlers
 * Handles authentication-related IPC communication
 */

import { ipcMain } from 'electron';

import { authService } from '../services/auth.service.js';

export function registerAuthHandlers() {
  // Signup
  ipcMain.handle(
    'auth:signup',
    async (_event, username: string, email: string, password: string) => {
      return authService.signup(username, email, password);
    }
  );

  // Login
  ipcMain.handle('auth:login', async (_event, email: string, password: string) => {
    return authService.login(email, password);
  });

  // Logout
  ipcMain.handle('auth:logout', async () => {
    return authService.logout();
  });

  // Change password
  ipcMain.handle(
    'auth:change-password',
    async (_event, currentPassword: string, newPassword: string) => {
      return authService.changePassword(currentPassword, newPassword);
    }
  );
}
