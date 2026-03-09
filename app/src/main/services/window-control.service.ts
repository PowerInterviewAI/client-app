import { BrowserWindow, screen } from 'electron';

import { MIN_HEIGHT, MIN_WIDTH } from '../consts.js';
import { configStore } from '../store/config.store.js';
import { appStateService } from './app-state.service.js';
import { pushNotificationService } from './push-notification.service.js';

// Global reference to the main window
let win: BrowserWindow | null = null;
let _stealth = configStore.getStealth();

// helper: return the display the window mostly occupies (fallback to primary)
function getCurrentDisplay(): Electron.Display {
  if (win && !win.isDestroyed()) {
    try {
      const b = win.getBounds();
      const d = screen.getDisplayMatching(b);
      if (d) return d;
    } catch {
      // fall through
    }
  }
  return screen.getPrimaryDisplay();
}

// Ensure stealth is disabled by default on load
try {
  configStore.setStealth(false);
  _stealth = false;
} catch (e) {
  console.warn('Failed to reset stealth state:', e);
}

export type WindowPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type ResizeDirection = 'up' | 'down' | 'left' | 'right';

interface WindowBounds {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * Set the window reference for all control functions
 */
export function setWindowReference(window: BrowserWindow): void {
  win = window;
}

/**
 * Retrieve the current main BrowserWindow reference (may be null)
 */
export function getWindowReference(): BrowserWindow | null {
  return win;
}

/**
 * Set window bounds with minimum size enforcement
 */
export function setWindowBounds(bounds: Partial<WindowBounds>): void {
  if (!win || win.isDestroyed()) return;

  // Fill missing values from current bounds
  // Ensure minimums
  if (bounds.width !== undefined && bounds.width < MIN_WIDTH) {
    bounds.width = MIN_WIDTH;
  }
  if (bounds.height !== undefined && bounds.height < MIN_HEIGHT) {
    bounds.height = MIN_HEIGHT;
  }

  win.setBounds(bounds);
}

/**
 * Move window to a specific corner or position
 */
export function moveWindowToCorner(corner: WindowPosition): void {
  if (!win || win.isDestroyed()) return;

  // use the display the window currently occupies; this matches the
  // user's request to operate on the screen where the window is placed.
  const display = getCurrentDisplay();
  const { width: screenWidth, height: screenHeight } = display.workAreaSize;
  const { width: winWidth, height: winHeight } = win.getBounds();
  const { x: displayX, y: displayY } = display.bounds;

  let x = 0,
    y = 0;

  // Support 9 positions: top-left, top-center, top-right,
  // middle-left, center, middle-right,
  // bottom-left, bottom-center, bottom-right
  switch (corner) {
    case 'top-left':
      x = 0;
      y = 0;
      break;
    case 'top-center':
      x = Math.floor((screenWidth - winWidth) / 2);
      y = 0;
      break;
    case 'top-right':
      x = screenWidth - winWidth;
      y = 0;
      break;
    case 'middle-left':
      x = 0;
      y = Math.floor((screenHeight - winHeight) / 2);
      break;
    case 'center':
      x = Math.floor((screenWidth - winWidth) / 2);
      y = Math.floor((screenHeight - winHeight) / 2);
      break;
    case 'middle-right':
      x = screenWidth - winWidth;
      y = Math.floor((screenHeight - winHeight) / 2);
      break;
    case 'bottom-left':
      x = 0;
      y = screenHeight - winHeight;
      break;
    case 'bottom-center':
      x = Math.floor((screenWidth - winWidth) / 2);
      y = screenHeight - winHeight;
      break;
    case 'bottom-right':
      x = screenWidth - winWidth;
      y = screenHeight - winHeight;
      break;
    default:
      // Fallback to center for unknown positions
      x = Math.floor((screenWidth - winWidth) / 2);
      y = Math.floor((screenHeight - winHeight) / 2);
  }

  setWindowBounds({ x: x + displayX, y: y + displayY });
  console.log(`🔄 Window moved to ${corner}`);
}

/**
 * Alias for moveWindowToCorner
 */
export function placeWindow(position: WindowPosition): void {
  try {
    moveWindowToCorner(position);
  } catch (e) {
    console.warn('placeWindow failed:', e);
  }
}

/**
 * Move window by arrow direction (small step)
 */
export function moveWindowByArrow(direction: ResizeDirection): void {
  if (!win || win.isDestroyed()) return;

  const bounds = win.getBounds();
  // pixels to move
  const moveAmount = 20;

  const updated: Partial<WindowBounds> = {};
  switch (direction) {
    case 'up':
      updated.y = bounds.y - moveAmount;
      break;
    case 'down':
      updated.y = bounds.y + moveAmount;
      break;
    case 'left':
      updated.x = bounds.x - moveAmount;
      break;
    case 'right':
      updated.x = bounds.x + moveAmount;
      break;
  }

  setWindowBounds(updated);
  console.log(`🔄 Window moved ${direction} by ${moveAmount}px`);
}

/**
 * Resize window by arrow direction
 */
export function resizeWindowByArrow(direction: ResizeDirection): void {
  if (!win || win.isDestroyed()) return;

  const bounds = win.getBounds();
  // pixels to resize
  const resizeAmount = 20;

  const updated: Partial<WindowBounds> = {};
  switch (direction) {
    case 'up':
      // Decrease height (shrink upward)
      updated.height = Math.max(MIN_HEIGHT, bounds.height - resizeAmount);
      break;
    case 'down':
      // Increase height (grow downward)
      updated.height = bounds.height + resizeAmount;
      break;
    case 'left':
      // Decrease width (shrink leftward)
      updated.width = Math.max(MIN_WIDTH, bounds.width - resizeAmount);
      break;
    case 'right':
      // Increase width (grow rightward)
      updated.width = bounds.width + resizeAmount;
      break;
  }

  setWindowBounds(updated);
  console.log(updated, win.getBounds()); // get updated bounds after resize
  console.log(`🔄 Window resized ${direction} by ${resizeAmount}px`);
}

/**
 * Enable stealth mode (transparent, click-through, always on top)
 */
export function enableStealth(): void {
  if (!win || win.isDestroyed()) return;

  try {
    // Ensure window stays always on top in stealth mode (use highest level)
    try {
      // Use a high z-order level so the overlay remains above other windows
      win.setAlwaysOnTop(true, 'screen-saver');
    } catch (e) {
      console.warn('setAlwaysOnTop with level failed:', e);
      // Fallback to basic always-on-top if level not supported
      try {
        win.setAlwaysOnTop(true);
      } catch (e) {
        console.warn('setAlwaysOnTop failed:', e);
      }
    }

    // Make the window visible on all workspaces and in fullscreen
    try {
      if (typeof win.setVisibleOnAllWorkspaces === 'function') {
        win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      }
    } catch (e) {
      console.warn('setVisibleOnAllWorkspaces failed:', e);
    }

    // Ignore mouse events so clicks pass through the window
    // forward: true ensures underlying windows still receive events
    win.setIgnoreMouseEvents(true, { forward: true });

    // Make window non-focusable so it doesn't capture keyboard events
    win.setFocusable(false);

    // Make the window semi-transparent
    win.setOpacity(0.9);

    _stealth = true;
    try {
      configStore.setStealth(_stealth);
    } catch (e) {
      console.warn('Failed to save stealth state:', e);
    }

    console.log('Stealth mode enabled');

    try {
      if (win && !win.isDestroyed()) {
        win.webContents.send('stealth-changed', _stealth);
      }
    } catch (e) {
      console.warn('Failed to send stealth-changed event:', e);
    }
  } catch (err) {
    console.warn('⚠️ enableStealth failed:', err);
  }
}

/**
 * Disable stealth mode (restore normal window behavior)
 */
export function disableStealth(): void {
  if (!win || win.isDestroyed()) return;

  try {
    win.setIgnoreMouseEvents(false);
    win.setFocusable(true);

    // Restore previous always-on-top state
    win.setAlwaysOnTop(false);

    // Restore full opacity
    win.setOpacity(1.0);

    _stealth = false;
    try {
      configStore.setStealth(_stealth);
    } catch (e) {
      console.warn('Failed to save stealth state:', e);
    }

    console.log('Stealth mode disabled');

    try {
      if (win && !win.isDestroyed()) {
        win.webContents.send('stealth-changed', _stealth);
      }
    } catch (e) {
      console.warn('Failed to send stealth-changed event:', e);
    }
  } catch (err) {
    console.warn('⚠️ disableStealth failed:', err);
  }
}

/**
 * Toggle stealth mode on/off
 */
export function toggleStealth(): void {
  // Check if user is logged in
  if (!appStateService.getState().isLoggedIn) {
    pushNotificationService.pushNotification({
      message: 'You must be logged in to use stealth mode.',
      type: 'error',
    });
    console.log('⚠️ Stealth mode requires authentication');
    return;
  }

  if (_stealth) {
    disableStealth();
  } else {
    enableStealth();
  }
}

/**
 * Toggle opacity between high and low (only in stealth mode)
 */
export function toggleOpacity(): void {
  if (!win || win.isDestroyed()) return;

  if (!_stealth) {
    pushNotificationService.pushNotification({
      message: 'Opacity toggle is only available in stealth mode.',
      type: 'warning',
    });
    console.log('⚠️ Opacity toggle is only available in stealth mode');
    return;
  }

  try {
    const current = win.getOpacity();
    const LOW = 0.2;
    const HIGH = 0.9;

    // If roughly at HIGH, switch to LOW, otherwise switch to HIGH
    const newOpacity = Math.abs(current - HIGH) < 0.05 ? LOW : HIGH;
    win.setOpacity(newOpacity);
    console.log(`🔄 Window opacity toggled to ${(newOpacity * 100).toFixed(0)}%`);
  } catch (err) {
    console.warn('⚠️ Opacity toggle not supported on this platform:', err);
  }
}
