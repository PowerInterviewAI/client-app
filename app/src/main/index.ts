import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import modules
import { MIN_HEIGHT, MIN_WIDTH } from './consts.js';
import { registerGlobalHotkeys, unregisterHotkeys } from './hotkeys.js';
import { registerAppStateHandlers } from './ipc/app-state.js';
import { registerAuthHandlers } from './ipc/auth.js';
import { registerAutoUpdaterHandlers } from './ipc/auto-updater.js';
import { registerCodeSuggestionHandlers } from './ipc/code-suggestion.js';
import { registerConfigHandlers } from './ipc/config.js';
import { registerExternalHandlers } from './ipc/external.js';
import { registerPaymentHandlers } from './ipc/payment.js';
import { registerReplySuggestionHandlers } from './ipc/reply-suggestion.js';
import { registerToolsHandlers } from './ipc/tools.js';
import { registerTranscriptHandlers } from './ipc/transcript.js';
import { registerWebRTCHandlers } from './ipc/webrtc.js';
import { registerWindowHandlers } from './ipc/window.js';
import { autoUpdaterService } from './services/auto-updater.service.js';
import { healthCheckService } from './services/health-check.service.js';
import { transcriptService } from './services/transcript.service.js';
import { webRtcService } from './services/webrtc.service.js';
import { setWindowReference } from './services/window-control.service.js';
import { setWindowReference as setZoomWindowReference } from './services/zoom.service.js';
import { configStore } from './store/config.store.js';
import { EnvUtil } from './utils/env.js';

let win: BrowserWindow | null = null;

// Ensure the application name is set (used by native dialogs/title fallbacks)
try {
  if (typeof app.setName === 'function') {
    app.setName('Power Interview');
  }
} catch (err) {
  console.warn('Failed to set app name:', err);
}

// Prevent Chromium from aggressively throttling timers/rendering
// when the window is occluded or in the background. This improves
// continuous video playback when the window is not on top.
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

// -------------------------------------------------------------
// SINGLE INSTANCE LOCK
// -------------------------------------------------------------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

// -------------------------------------------------------------
// CREATE WINDOW
// -------------------------------------------------------------
async function createWindow() {
  // minimum size constants (already imported above)

  // Load previously saved window bounds, fall back to sensible defaults
  const savedBounds = configStore.getWindowBounds() || {
    width: 1024,
    height: 640,
  };
  console.log('Restoring window bounds:', savedBounds);

  // Ensure bounds meet minimum requirements to avoid tiny or invalid windows
  // (zero is treated as invalid because it's falsy in the earlier check)
  if (!savedBounds.width || savedBounds.width < MIN_WIDTH) {
    savedBounds.width = MIN_WIDTH;
  }
  if (!savedBounds.height || savedBounds.height < MIN_HEIGHT) {
    savedBounds.height = MIN_HEIGHT;
  }
  console.log('Adjusted window bounds with minimum constraints:', savedBounds);

  win = new BrowserWindow({
    title: 'Power Interview',
    ...savedBounds,
    transparent: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      // Keep renderer timers running and avoid throttling when the window
      // is occluded or not focused so video/audio playback remains smooth.
      backgroundThrottling: false,
    },
  });

  // Remove the default application menu and hide the menu bar
  try {
    Menu.setApplicationMenu(null);
  } catch (e) {
    console.warn('Failed to set application menu:', e);
  }
  win.setMenuBarVisibility(false);
  win.setAutoHideMenuBar(true);

  // Enable content protection to prevent screen capture/recording (unless disabled via CLI)
  const disableContentProtection = process.argv.includes('--disable-content-protection');
  if (!disableContentProtection) {
    console.log('Enabling content protection to prevent screen capture/recording');
    win.setContentProtection(true);
  } else {
    console.log('Content protection is disabled via command line argument');
  }

  // Set window reference for window controls
  setWindowReference(win);
  // also give the zoom service a reference so it can adjust the webcontents
  setZoomWindowReference(win);

  win.on('close', () => {
    if (win) {
      configStore.saveWindowBounds(win.getBounds());
    }
  });

  // Clear cache before loading
  await win.webContents.session.clearCache();

  if (EnvUtil.isDev()) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // Use app.getAppPath() for conventional path resolution
    // This works correctly whether the app is packaged or not
    const distPath = path.join(app.getAppPath(), 'dist', 'index.html');
    console.log('Loading from:', distPath);
    win.loadFile(distPath);
  }
}

// -------------------------------------------------------------
// APP LIFECYCLE
// -------------------------------------------------------------
app.whenReady().then(async () => {
  // Register all IPC handlers
  registerConfigHandlers();
  registerAppStateHandlers();
  registerAuthHandlers();
  registerPaymentHandlers();
  registerTranscriptHandlers();
  registerReplySuggestionHandlers();
  registerCodeSuggestionHandlers();
  registerWebRTCHandlers();
  registerToolsHandlers();
  registerAutoUpdaterHandlers();
  registerExternalHandlers();

  // Create window
  await createWindow();

  // Register window-specific IPC handlers
  if (win) {
    registerWindowHandlers(win);

    // Set window reference for auto-updater
    autoUpdaterService.setMainWindow(win);

    // Check for updates on app launch
    // Use setTimeout to avoid blocking the app initialization
    setTimeout(() => {
      autoUpdaterService.checkForUpdates().catch((error) => {
        console.error('[Main] Failed to check for updates:', error);
      });
    }, 3000); // Wait 3 seconds after app launch
  }

  // Start health check service
  await healthCheckService.start();

  // Register hotkeys
  registerGlobalHotkeys();
});

app.on('will-quit', async () => {
  // Stop all services
  await transcriptService.stop();
  await webRtcService.stopAgents();
  healthCheckService.stop();

  unregisterHotkeys();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
