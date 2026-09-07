import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { UpdateStatus, useAutoUpdater } from '@/hooks/use-auto-updater';
import { useSaveHistoryPrompt } from '@/hooks/use-save-history-guard';
import { getElectron } from '@/lib/utils';

export function UpdateNotification() {
  const { updateStatus, quitAndInstall } = useAutoUpdater();
  const lastStatusRef = useRef<UpdateStatus | null>(null);
  const downloadToastIdRef = useRef<string | number | null>(null);

  /**
   * Installing takes the app down, so it loses the interview exactly as closing does - and
   * unlike a close it cannot be vetoed once started, because the installer is launched before
   * the quit is requested. So the question is asked here, in front of it.
   *
   * `hasHistory` is read from main on the click rather than through `useSaveHistoryGuard`.
   * That hook subscribes to the app state, which during an interview is a new object several
   * times a second, and this component would then re-render - and re-arm its status effect -
   * on every ASR partial to answer a question it only asks when a button is pressed. One round
   * trip on the click also reads the flag where it is derived rather than a broadcast behind.
   */
  const confirmThenInstall = useCallback(async () => {
    const electron = getElectron();
    const state = await electron?.appState.get();

    // Both subjects, the same pair the window-close guard fires on. Installing an update calls
    // `allowNextClose()` and so goes *past* that guard, making this the only thing standing
    // between the session and the installer - and checking `hasHistory` alone meant a mock
    // interview with no live session behind it was destroyed without being offered a save.
    if (state?.hasHistory || state?.hasMockContent) {
      const proceed = await useSaveHistoryPrompt.getState().prompt('update');
      if (!proceed) return;
    }

    await quitAndInstall();
  }, [quitAndInstall]);

  useEffect(() => {
    if (!updateStatus) return;

    const { status, info, progress, error } = updateStatus;

    if (lastStatusRef.current === status) {
      if (status === UpdateStatus.Downloading && downloadToastIdRef.current && progress) {
        toast.loading(`Downloading update... ${progress.percent.toFixed(0)}%`, {
          id: downloadToastIdRef.current,
          description: `${(progress.transferred / 1024 / 1024).toFixed(1)} MB / ${(progress.total / 1024 / 1024).toFixed(1)} MB`,
        });
      }
      return;
    }

    lastStatusRef.current = status;

    switch (status) {
      case UpdateStatus.Checking:
      case UpdateStatus.NotAvailable:
        break;

      case UpdateStatus.Available:
        if (info) {
          toast.info(`Update Available: v${info.version}`, {
            description: 'Download will start automatically in the background.',
            duration: 5000,
          });
        }
        break;

      case UpdateStatus.Downloading:
        if (progress) {
          downloadToastIdRef.current = toast.loading(
            `Downloading update... ${progress.percent.toFixed(0)}%`,
            {
              description: `${(progress.transferred / 1024 / 1024).toFixed(1)} MB / ${(progress.total / 1024 / 1024).toFixed(1)} MB`,
            }
          );
        }
        break;

      case UpdateStatus.Downloaded:
        if (downloadToastIdRef.current) {
          toast.dismiss(downloadToastIdRef.current);
          downloadToastIdRef.current = null;
        }

        if (info) {
          const isMac = window.electronAPI?.platform === 'darwin';
          toast.success(`Update Downloaded: v${info.version}`, {
            description: isMac
              ? 'Click to open the installer, then drag it into Applications.'
              : 'Click to restart and install the update.',
            duration: Infinity,
            action: {
              label: isMac ? 'Open Installer' : 'Restart Now',
              onClick: () => void confirmThenInstall(),
            },
          });
        }
        break;

      case UpdateStatus.Error:
        if (downloadToastIdRef.current) {
          toast.dismiss(downloadToastIdRef.current);
          downloadToastIdRef.current = null;
        }
        console.error('[UpdateNotification] Update error:', error);
        break;
    }
  }, [updateStatus, confirmThenInstall]);

  return null;
}
