/**
 * Update Notification Component
 * Displays update notifications and handles user interactions
 */

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

    // Avoid duplicate notifications for the same status
    if (lastStatusRef.current === status) {
      // Update download progress toast if it exists
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
        // Don't show intrusive UI for checking
        console.log('[UpdateNotification] Checking for updates...');
        break;

      case UpdateStatus.Available:
        if (info) {
          toast.info(`Update Available: v${info.version}`, {
            description: 'Download will start automatically in the background.',
            duration: 5000,
          });
        }
        break;

      case UpdateStatus.NotAvailable:
        // Don't show notification for no updates
        console.log('[UpdateNotification] No updates available');
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
        // Dismiss download progress toast
        if (downloadToastIdRef.current) {
          toast.dismiss(downloadToastIdRef.current);
          downloadToastIdRef.current = null;
        }

        if (info) {
          toast.success(`Update Downloaded: v${info.version}`, {
            description: 'Click to restart and install the update.',
            duration: Infinity, // Keep until user interacts
            action: {
              label: 'Restart Now',
              onClick: () => {
                quitAndInstall();
              },
            },
            cancel: {
              label: 'Later',
              onClick: () => {
                toast.info('Update will be installed when you close the app');
              },
            },
          });
        }
        break;

      case UpdateStatus.Error:
        // Dismiss download progress toast if exists
        if (downloadToastIdRef.current) {
          toast.dismiss(downloadToastIdRef.current);
          downloadToastIdRef.current = null;
        }

        console.error('[UpdateNotification] Update error:', error);
        // Don't show error toast to avoid disrupting user experience
        // Error is logged for debugging
        break;

      default:
        break;
    }
  }, [updateStatus, quitAndInstall]);

  // This component doesn't render anything visible
  return null;
}
