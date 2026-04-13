/**
 * Auto-Updater Service
 * Handles automatic updates from GitHub Releases
 *
 * Features:
 * - Check for updates on app launch
 * - Background download of updates
 * - User notification and restart prompting
 * - Graceful error handling
 * - Lifecycle event logging
 */

import pkg from 'electron-updater';
const { autoUpdater } = pkg;

import { BrowserWindow } from 'electron';

import { EnvUtil } from '../utils/env.js';

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

export enum UpdateStatus {
  Checking = 'checking',
  Available = 'available',
  NotAvailable = 'not-available',
  Downloading = 'downloading',
  Downloaded = 'downloaded',
  Error = 'error',
}

export interface UpdateProgressInfo {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

class AutoUpdaterService {
  private mainWindow: BrowserWindow | null = null;
  private updateCheckInProgress = false;

  constructor() {
    this.setupAutoUpdater();
  }

  /**
   * Initialize auto-updater configuration
   */
  private setupAutoUpdater(): void {
    // Configure auto-updater
    autoUpdater.autoDownload = true; // Download automatically when update is available
    autoUpdater.autoInstallOnAppQuit = true; // Install on quit

    // Logging configuration
    autoUpdater.logger = {
      // eslint-disable-next-line
      info: (message: any) => console.log('[AutoUpdater]', message),
      // eslint-disable-next-line
      warn: (message: any) => console.warn('[AutoUpdater]', message),
      // eslint-disable-next-line
      error: (message: any) => console.error('[AutoUpdater]', message),
      // eslint-disable-next-line
      debug: (message: any) => console.debug('[AutoUpdater]', message),
    };

    this.registerEventHandlers();
  }

  /**
   * Register event handlers for auto-updater lifecycle
   */
  private registerEventHandlers(): void {
    // Checking for update
    autoUpdater.on('checking-for-update', () => {
      console.log('[AutoUpdater] Checking for updates...');
      this.notifyRenderer(UpdateStatus.Checking, null);
    });

    // Update available
    autoUpdater.on('update-available', (info) => {
      console.log('[AutoUpdater] Update available:', info.version);
      this.notifyRenderer(UpdateStatus.Available, {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes as string | undefined,
      });
    });

    // Update not available
    autoUpdater.on('update-not-available', (info) => {
      console.log('[AutoUpdater] No updates available. Current version:', info.version);
      this.updateCheckInProgress = false;
      this.notifyRenderer(UpdateStatus.NotAvailable, null);
    });

    // Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      console.log(
        `[AutoUpdater] Download progress: ${progressObj.percent.toFixed(2)}% (${(progressObj.bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s)`
      );
      this.notifyRenderer(UpdateStatus.Downloading, null, {
        bytesPerSecond: progressObj.bytesPerSecond,
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
      });
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      console.log('[AutoUpdater] Update downloaded:', info.version);
      console.log('[AutoUpdater] Update will be installed on app restart');
      this.updateCheckInProgress = false;
      this.notifyRenderer(UpdateStatus.Downloaded, {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes as string | undefined,
      });
    });

    // Error handling
    autoUpdater.on('error', (error) => {
      console.error('[AutoUpdater] Error:', error);
      this.updateCheckInProgress = false;
      this.notifyRenderer(UpdateStatus.Error, null, null, error.message || 'Unknown error');
    });
  }

  /**
   * Set the main window reference for sending IPC messages
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Check for updates
   * @returns Promise that resolves when check is complete
   */
  async checkForUpdates(): Promise<void> {
    if (this.updateCheckInProgress) {
      console.log('[AutoUpdater] Update check already in progress, skipping...');
      return;
    }

    // Force dev update config if in development mode for testing
    if (EnvUtil.isDev()) {
      console.log('[AutoUpdater] Forcing dev update config for testing');
      autoUpdater.forceDevUpdateConfig = true;
    }

    this.updateCheckInProgress = true;

    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('[AutoUpdater] Failed to check for updates:', error);
      this.updateCheckInProgress = false;
      // Error will be handled by the 'error' event handler
    }
  }

  /**
   * Quit and install the downloaded update
   */
  quitAndInstall(): void {
    console.log('[AutoUpdater] Quitting and installing update...');
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * Send update status to renderer process
   */
  private notifyRenderer(
    status: UpdateStatus,
    info: UpdateInfo | null,
    progress?: UpdateProgressInfo | null,
    error?: string
  ): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    this.mainWindow.webContents.send('auto-updater:status', {
      status,
      info,
      progress,
      error,
    });
  }

  /**
   * Get current version
   */
  getCurrentVersion(): string {
    return autoUpdater.currentVersion.version;
  }
}

export const autoUpdaterService = new AutoUpdaterService();
