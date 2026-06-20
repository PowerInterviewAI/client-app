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

  private setupAutoUpdater(): void {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.logger = {
      info: (...args) => console.log('[AutoUpdater]', ...args),
      warn: (...args) => console.warn('[AutoUpdater]', ...args),
      error: (...args) => console.error('[AutoUpdater]', ...args),
      debug: (...args) => console.debug('[AutoUpdater]', ...args),
    };

    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    autoUpdater.on('checking-for-update', () => {
      console.log('[AutoUpdater] Checking for updates...');
      this.notifyRenderer(UpdateStatus.Checking, null);
    });

    autoUpdater.on('update-available', (info) => {
      console.log('[AutoUpdater] Update available:', info.version);
      this.notifyRenderer(UpdateStatus.Available, {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes as string | undefined,
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('[AutoUpdater] No updates available. Current version:', info.version);
      this.updateCheckInProgress = false;
      this.notifyRenderer(UpdateStatus.NotAvailable, null);
    });

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

    autoUpdater.on('update-downloaded', (info) => {
      console.log('[AutoUpdater] Update downloaded:', info.version);
      this.updateCheckInProgress = false;
      this.notifyRenderer(UpdateStatus.Downloaded, {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes as string | undefined,
      });
    });

    autoUpdater.on('error', (error) => {
      console.error('[AutoUpdater] Error:', error);
      this.updateCheckInProgress = false;
      this.notifyRenderer(UpdateStatus.Error, null, null, error.message || 'Unknown error');
    });
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  async checkForUpdates(): Promise<void> {
    if (this.updateCheckInProgress) {
      return;
    }

    if (EnvUtil.isDev()) {
      autoUpdater.forceDevUpdateConfig = true;
    }

    this.updateCheckInProgress = true;

    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('[AutoUpdater] Failed to check for updates:', error);
      this.updateCheckInProgress = false;
    }
  }

  quitAndInstall(): void {
    autoUpdater.quitAndInstall(false, true);
  }

  getCurrentVersion(): string {
    return autoUpdater.currentVersion.version;
  }

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
}

export const autoUpdaterService = new AutoUpdaterService();
