import { BrowserWindow, screen } from 'electron';

import { MIN_HEIGHT, MIN_WIDTH } from '../consts.js';
import { configStore } from '../store/config.store.js';
import { appStateService } from './app-state.service.js';
import { pushNotificationService } from './push-notification.service.js';

// Global reference to the main window
let win: BrowserWindow | null = null;
let _stealth = configStore.getStealth();

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
export function setWindowBounds(bounds: WindowBounds): void {
  if (!win || win.isDestroyed()) return;

  try {
    // Fill missing values from current bounds
    const current = win.getBounds();
    const newBounds = Object.assign({}, current, bounds || {});

    // Ensure minimums
    if (newBounds.width < MIN_WIDTH) {
      newBounds.width = MIN_WIDTH;
    }
    if (newBounds.height < MIN_HEIGHT) {
      newBounds.height = MIN_HEIGHT;
    }

    win.setBounds(newBounds);
  } catch (err) {
    console.warn('setWindowBounds error:', err);
    // Fallback to original behaviour if anything goes wrong
    try {
      win.setBounds(bounds);
    } catch (e) {
      console.warn('Fallback setBounds also failed:', e);
    }
  }
}

/**
 * Move window to a specific corner or position
 */
export function moveWindowToCorner(corner: WindowPosition): void {
  if (!win || win.isDestroyed()) return;

  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const { width: winWidth, height: winHeight } = win.getBounds();

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

  setWindowBounds({ x, y, width: winWidth, height: winHeight });
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
  const moveAmount = 20; // pixels to move

  switch (direction) {
    case 'up':
      bounds.y = bounds.y - moveAmount;
      break;
    case 'down':
      bounds.y = bounds.y + moveAmount;
      break;
    case 'left':
      bounds.x = bounds.x - moveAmount;
      break;
    case 'right':
      bounds.x = bounds.x + moveAmount;
      break;
  }

  setWindowBounds(bounds);
  console.log(`🔄 Window moved ${direction} by ${moveAmount}px`);
}

/**
 * Resize window by arrow direction
 */
export function resizeWindowByArrow(direction: ResizeDirection): void {
  if (!win || win.isDestroyed()) return;

  const bounds = win.getBounds();
  const resizeAmount = 20; // pixels to resize

  switch (direction) {
    case 'up':
      // Decrease height (shrink upward)
      bounds.height = Math.max(200, bounds.height - resizeAmount);
      break;
    case 'down':
      // Increase height (grow downward)
      bounds.height = bounds.height + resizeAmount;
      break;
    case 'left':
      // Decrease width (shrink leftward)
      bounds.width = Math.max(300, bounds.width - resizeAmount);
      break;
    case 'right':
      // Increase width (grow rightward)
      bounds.width = bounds.width + resizeAmount;
      break;
  }

  setWindowBounds(bounds);
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
