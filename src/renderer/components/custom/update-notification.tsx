import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { UpdateStatus, useAutoUpdater } from '@/hooks/use-auto-updater';

export function UpdateNotification() {
  const { updateStatus, quitAndInstall } = useAutoUpdater();
  const lastStatusRef = useRef<UpdateStatus | null>(null);
  const downloadToastIdRef = useRef<string | number | null>(null);

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
          toast.success(`Update Downloaded: v${info.version}`, {
            description: 'Click to restart and install the update.',
            duration: Infinity,
            action: {
              label: 'Restart Now',
              onClick: () => quitAndInstall(),
            },
            cancel: {
              label: 'Later',
              onClick: () => toast.info('Update will be installed when you close the app.'),
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
  }, [updateStatus, quitAndInstall]);

  return null;
}
