import { useCallback, useEffect, useState } from 'react';

export enum UpdateStatus {
  Downloaded = 'downloaded',
  Error = 'error',
}

export interface UpdateStatusData {
  status: UpdateStatus;
  version?: string;
  error?: string;
}

export function useAutoUpdater() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatusData | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');

  useEffect(() => {
    if (!window.electronAPI?.autoUpdater) return;

    window.electronAPI.autoUpdater
      .getVersion()
      .then((version: unknown) => {
        if (typeof version === 'string') setCurrentVersion(version);
      })
      .catch((error: unknown) => {
        console.error('[Updater] failed to get version:', error);
      });

    const cleanup = window.electronAPI.autoUpdater.onStatusUpdate((data) => {
      setUpdateStatus(data as UpdateStatusData);
    });

    return cleanup;
  }, []);

  const checkForUpdates = useCallback(async (): Promise<void> => {
    try {
      await window.electronAPI?.autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('[Updater] check failed:', error);
    }
  }, []);

  const quitAndInstall = useCallback(async (): Promise<void> => {
    try {
      await window.electronAPI?.autoUpdater.quitAndInstall();
    } catch (error) {
      console.error('[Updater] install failed:', error);
    }
  }, []);

  return { updateStatus, currentVersion, checkForUpdates, quitAndInstall };
}
