import { ipcMain } from 'electron';

import { ZOOM_STEP } from '../consts.js';
import { appStateService } from '../services/app-state.service.js';
import { pushNotificationService } from '../services/push-notification.service.js';
import * as windowControls from '../services/window-control.service.js';
import * as zoomService from '../services/zoom.service.js';

/**
 * Handlers are registered once, but the window they act on can be replaced - relaunching the app
 * recreates it if it was destroyed. Resolve it per call instead of capturing it, or every one of
 * these silently no-ops against the old window.
 */
export function registerWindowHandlers(): void {
  const window = () => windowControls.getWindowReference();

  ipcMain.on('window:close', () => {
    const win = window();
    if (win && !win.isDestroyed()) win.close();
  });

  ipcMain.on('window:minimize', () => {
    const win = window();
    if (win && !win.isDestroyed()) win.minimize();
  });

  ipcMain.on('window:maximize', () => {
    const win = window();
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
  // Invoke rather than send, unlike the three above: the settings field that calls this waits
  // for the applied factor so its readout cannot drift from the window when a value is clamped.
  ipcMain.handle('zoom:set-factor', (_event, factor: number) => {
    try {
      if (typeof factor !== 'number' || !isFinite(factor)) return zoomService.getZoomFactor();
      zoomService.setZoomFactor(factor);
      return zoomService.getZoomFactor();
    } catch (e) {
      console.warn('zoom:set-factor handler error', e);
      return 1;
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
