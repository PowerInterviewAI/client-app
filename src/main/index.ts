import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import modules
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, MIN_HEIGHT, MIN_WIDTH } from './consts.js';
import { registerGlobalHotkeys, unregisterHotkeys } from './hotkeys.js';
import { registerAccountHandlers } from './ipc/account.js';
import { registerAppStateHandlers } from './ipc/app-state.js';
import { registerAuthHandlers } from './ipc/auth.js';
import { registerAutoUpdaterHandlers } from './ipc/auto-updater.js';
import { registerConfigHandlers } from './ipc/config.js';
import { registerExternalHandlers } from './ipc/external.js';
import { registerMockInterviewHandlers } from './ipc/mock-interview.js';
import { registerPaymentHandlers } from './ipc/payment.js';
import { registerPermissionHandlers } from './ipc/permissions.js';
import { registerActionSuggestionHandlers } from './ipc/suggestion-action.js';
import { registerLiveSuggestionHandlers } from './ipc/suggestion-live.js';
import { registerToolsHandlers } from './ipc/tools.js';
import { initializeAudioLoopback, registerTranscriptHandlers } from './ipc/transcript.js';
import { registerWindowHandlers } from './ipc/window.js';
import { installNavigationGuard } from './navigation-guard.js';
import { autoUpdaterService } from './services/auto-updater.service.js';
import { healthCheckService } from './services/health-check.service.js';
import { transcriptService } from './services/transcript.service.js';
import { restoreWindow, setWindowReference } from './services/window-control.service.js';
import { setWindowReference as setZoomWindowReference } from './services/zoom.service.js';
import { configStore } from './store/config.store.js';
import { EnvUtil } from './utils/env.js';
import { installCloseGuard, registerCloseGuardHandlers } from './window-close-guard.js';

let win: BrowserWindow | null = null;

// Must run before app is ready so built-in loopback IPC handlers are registered.
initializeAudioLoopback();

// Ensure the application name is set (used by native dialogs/title fallbacks)
try {
  if (typeof app.setName === 'function') {
    app.setName('Power Interview AI');
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

// Force Chrome to treat all displays as 100% scale.  Some high‑DPI
// environments previously caused the app to be rendered at 2× or higher
// and the code already had dpi‑aware logic; disabling scaling entirely
// makes sizes consistent regardless of platform settings.
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');

// -------------------------------------------------------------
// SINGLE INSTANCE LOCK
// -------------------------------------------------------------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Launching the app again is the recovery path when the window is out of reach, so it has to
    // survive a destroyed window rather than throwing on it.
    if (!win || win.isDestroyed()) {
      createWindow()
        // The updater holds its own reference for progress toasts; the IPC handlers resolve
        // the window per call, so they need nothing here.
        .then(() => {
          if (win) autoUpdaterService.setMainWindow(win);
        })
        .catch((err) => console.error('Failed to recreate window:', err));
      return;
    }
    restoreWindow();
  });
}

// -------------------------------------------------------------
// CREATE WINDOW
// -------------------------------------------------------------
async function createWindow() {
  const savedBounds = configStore.getWindowBounds() || {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  };

  // Clamp to minimum so persisted tiny/invalid bounds don't create unusable windows
  if (!savedBounds.width || savedBounds.width < MIN_WIDTH) savedBounds.width = MIN_WIDTH;
  if (!savedBounds.height || savedBounds.height < MIN_HEIGHT) savedBounds.height = MIN_HEIGHT;

  win = new BrowserWindow({
    title: 'Power Interview AI',
    ...savedBounds,
    titleBarStyle: 'hidden',
    // No skipTaskbar here: the taskbar button and the Dock icon follow stealth mode instead, and
    // the app starts in normal mode. See applySurfaceVisibility() in window-control.service.
    //
    // Center traffic lights vertically in the h-9 (36px) titlebar.
    // Default y=7 puts button centers at 13px; (36-12)/2=12 is exact center.
    trafficLightPosition: { x: 7, y: 12 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      // Keep renderer timers running and avoid throttling when the window
      // is occluded or not focused so video/audio playback remains smooth.
      backgroundThrottling: false,
    },
  });

  win.setMinimumSize(MIN_WIDTH, MIN_HEIGHT);

  // On macOS, keep a minimal menu so Cmd+C/V/X/A/Z/Q work.
  // On Windows/Linux, remove the menu bar entirely.
  if (process.platform === 'darwin') {
    const macMenu = Menu.buildFromTemplate([
      {
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
        ],
      },
    ]);
    Menu.setApplicationMenu(macMenu);
  } else {
    try {
      Menu.setApplicationMenu(null);
    } catch (e) {
      console.warn('Failed to set application menu:', e);
    }
    win.setMenuBarVisibility(false);
    win.setAutoHideMenuBar(true);
  }

  // Pass --disable-content-protection on the CLI to allow screen recording (dev/testing only)
  win.setContentProtection(!process.argv.includes('--disable-content-protection'));

  setWindowReference(win);
  setZoomWindowReference(win);

  win.on('close', () => {
    if (win) {
      configStore.saveWindowBounds(win.getBounds());
    }
  });

  // After the bounds listener, so a close the guard vetoes has still recorded where the window
  // was - the user is about to be asked a question, not to have their layout forgotten.
  installCloseGuard(win);

  // Clear cache before loading
  await win.webContents.session.clearCache();

  // Installed before the load, so the guard is in place for the app's very first document.
  // Idempotent, because this function runs again when the single-instance lock recovers a
  // destroyed window and `web-contents-created` is an app-level event.
  if (EnvUtil.isDev()) {
    const devUrl = 'http://localhost:15173';
    installNavigationGuard(devUrl);
    win.loadURL(devUrl);
    win.webContents.openDevTools();
  } else {
    // Use app.getAppPath() for conventional path resolution
    // This works correctly whether the app is packaged or not
    const distPath = path.join(app.getAppPath(), 'dist', 'index.html');
    console.log('Loading from:', distPath);
    installNavigationGuard(pathToFileURL(distPath).href);
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
  registerAccountHandlers();
  registerPaymentHandlers();
  registerPermissionHandlers();
  registerTranscriptHandlers();
  registerLiveSuggestionHandlers();
  registerActionSuggestionHandlers();
  registerMockInterviewHandlers();
  registerToolsHandlers();
  registerAutoUpdaterHandlers();
  registerExternalHandlers();
  registerCloseGuardHandlers();

  // Create window
  await createWindow();

  // Register window-specific IPC handlers
  registerWindowHandlers();

  if (win) {
    autoUpdaterService.setMainWindow(win);

    // 3s delay gives the renderer time to mount before the first toast fires
    setTimeout(() => {
      autoUpdaterService.checkForUpdates().catch((error) => {
        console.error('[Main] Failed to check for updates:', error);
      });

      setInterval(() => {
        autoUpdaterService.checkForUpdates().catch((error) => {
          console.error('[Main] Failed to check for updates:', error);
        });
      }, 5 * 60_000);
    }, 3000);
  }

  // Start health check service
  await healthCheckService.start();

  // Register hotkeys
  registerGlobalHotkeys();
});

app.on('will-quit', async () => {
  // Stop all services
  await transcriptService.stop();
  healthCheckService.stop();

  unregisterHotkeys();
});

// The usual macOS "stay alive with no windows" behavior assumes a Dock icon to click. In stealth
// mode there is none, so a windowless process would just sit there holding the global hotkeys
// with no way to reach it. Closing the window means quitting, on every platform.
app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
