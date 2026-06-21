import { BrowserWindow, ipcMain } from 'electron';

import { ZOOM_STEP } from '../consts.js';
import { appStateService } from '../services/app-state.service.js';
import { pushNotificationService } from '../services/push-notification.service.js';
import * as windowControls from '../services/window-control.service.js';
import * as zoomService from '../services/zoom.service.js';

export function registerWindowHandlers(win: BrowserWindow): void {
  ipcMain.on('window:close', () => {
    if (win && !win.isDestroyed()) win.close();
  });

  ipcMain.on('window:minimize', () => {
    if (win && !win.isDestroyed()) win.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (win && !win.isDestroyed()) {
      if (win.isMaximized()) win.unmaximize();
      else win.maximize();
    }
  });

  ipcMain.on('zoom:in', () => {
    try {
      zoomService.adjustZoom(ZOOM_STEP);
    } catch (e) {
      console.warn('zoom:in handler error', e);
    }
  });
  ipcMain.on('zoom:out', () => {
    try {
      zoomService.adjustZoom(-ZOOM_STEP);
    } catch (e) {
      console.warn('zoom:out handler error', e);
    }
  });
  ipcMain.on('zoom:reset', () => {
    try {
      zoomService.resetZoom();
    } catch (e) {
      console.warn('zoom:reset handler error', e);
    }
  });

  ipcMain.on('window:set-stealth', (_event, isStealth: boolean) => {
    try {
      if (!appStateService.getState().isLoggedIn) {
        pushNotificationService.pushNotification({
          message: 'You must be logged in to use stealth mode.',
          type: 'error',
        });
        return;
      }

      if (isStealth) {
        windowControls.enableStealth();
      } else {
        windowControls.disableStealth();
      }
    } catch (err) {
      console.warn('window:set-stealth handler error:', err);
    }
  });

  ipcMain.on('window:toggle-stealth', () => {
    try {
      windowControls.toggleStealth();
    } catch (err) {
      console.warn('window:toggle-stealth handler error:', err);
    }
  });

  ipcMain.handle('zoom:get-factor', () => {
    try {
      return zoomService.getZoomFactor();
    } catch (e) {
      console.warn('zoom:get-factor handler error', e);
      return 1;
    }
  });

  ipcMain.on('window:toggle-opacity', () => {
    try {
      windowControls.toggleOpacity();
    } catch (err) {
      console.warn('window:toggle-opacity handler error:', err);
    }
  });
}
