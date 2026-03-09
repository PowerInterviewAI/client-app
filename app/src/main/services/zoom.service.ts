import { BrowserWindow } from 'electron';
import { ZOOM_MAX_FACTOR, ZOOM_MIN_FACTOR, ZOOM_STEP } from '../consts.js';
import { configStore } from '../store/config.store.js';

let win: BrowserWindow | null = null;

export function setWindowReference(window: BrowserWindow) {
  win = window;

  const applySaved = () => {
    try {
      const saved = configStore.getZoomFactor();
      console.log('[zoom.service] applying stored zoom factor:', saved);
      if (saved && !isNaN(saved)) {
        const clamped = clamp(saved);
        win!.webContents.setZoomFactor(clamped);
      }
    } catch (e) {
      console.warn('zoom.service:apply saved zoom failed', e);
    }
  };

  // immediate attempt in case content already exists
  applySaved();

  // also reapply after each load event; renderer pages may reset zoom
  try {
    win.webContents.on('did-finish-load', () => {
      applySaved();
      notifyChange(getZoomFactor());
    });
  } catch (e) {
    console.warn('zoom.service:failed to attach did-finish-load listener', e);
  }

  // send initial zoom factor so UI can display correct percentage
  try {
    notifyChange(getZoomFactor());
  } catch (e) {
    console.warn('zoom.service:initial notify failed', e);
  }
}

function clamp(value: number): number {
  if (value < ZOOM_MIN_FACTOR) return ZOOM_MIN_FACTOR;
  if (value > ZOOM_MAX_FACTOR) return ZOOM_MAX_FACTOR;
  return value;
}

export function getZoomFactor(): number {
  if (!win || win.isDestroyed()) return 1;
  try {
    return win.webContents.getZoomFactor();
  } catch (e) {
    console.warn('zoom.service:getZoomFactor failed', e);
    return 1;
  }
}

export function setZoomFactor(factor: number): void {
  if (!win || win.isDestroyed()) return;
  const clamped = clamp(factor);
  try {
    win.webContents.setZoomFactor(clamped);
    notifyChange(clamped);
    // persist new value
    try {
      configStore.saveZoomFactor(clamped);
    } catch (e) {
      console.warn('zoom.service:saveZoomFactor failed', e);
    }
  } catch (e) {
    console.warn('zoom.service:setZoomFactor failed', e);
  }
}

export function adjustZoom(delta: number): void {
  if (!win || win.isDestroyed()) return;
  const current = getZoomFactor();
  setZoomFactor(current + delta);
}

export function resetZoom(): void {
  setZoomFactor(1);
}

function notifyChange(factor: number): void {
  if (!win || win.isDestroyed()) return;
  try {
    // send percent to renderer
    win.webContents.send('zoom-level-changed', Math.round(factor * 100));
  } catch (e) {
    console.warn('zoom.service:notifyChange failed', e);
  }
}
