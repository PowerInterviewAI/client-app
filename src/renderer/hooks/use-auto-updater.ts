import { useCallback, useEffect, useState } from 'react';

export enum UpdateStatus {
  Checking = 'checking',
  Available = 'available',
  NotAvailable = 'not-available',
  Downloading = 'downloading',
  Downloaded = 'downloaded',
  Error = 'error',
}

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

export interface UpdateProgressInfo {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export interface UpdateStatusData {
  status: UpdateStatus;
  info: UpdateInfo | null;
  progress?: UpdateProgressInfo | null;
  error?: string;
}

export function useAutoUpdater() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatusData | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');

  useEffect(() => {
    if (!window.electronAPI?.autoUpdater) return;

    window.electronAPI.autoUpdater
      .getVersion()
      .then((result) => {
        if (result.success && result.version) {
          setCurrentVersion(result.version);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to get version:', error);
      });

    return window.electronAPI.autoUpdater.onStatusUpdate((data) => {
      setUpdateStatus(data as UpdateStatusData);
    });
  }, []);

  const checkForUpdates = useCallback(async (): Promise<void> => {
    if (!window.electronAPI?.autoUpdater) {
      console.warn('Auto-updater API not available');
      return;
    }

    try {
      const result = await window.electronAPI.autoUpdater.checkForUpdates();
      if (!result.success) {
        console.error('Failed to check for updates:', result.error);
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }, []);

  const quitAndInstall = useCallback(async (): Promise<void> => {
    if (!window.electronAPI?.autoUpdater) {
      console.warn('Auto-updater API not available');
      return;
    }

    try {
      const result = await window.electronAPI.autoUpdater.quitAndInstall();
      if (!result.success) {
        console.error('Failed to quit and install:', result.error);
      }
    } catch (error) {
      console.error('Failed to quit and install:', error);
    }
  }, []);

  return {
    updateStatus,
    currentVersion,
    checkForUpdates,
    quitAndInstall,
  };
}
