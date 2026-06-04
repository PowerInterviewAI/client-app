import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { UpdateStatus, useAutoUpdater } from '@/hooks/use-auto-updater';

export function UpdateNotification() {
  const { updateStatus, quitAndInstall } = useAutoUpdater();
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!updateStatus || notifiedRef.current) return;
    if (updateStatus.status !== UpdateStatus.Downloaded) return;

    notifiedRef.current = true;
    const { version } = updateStatus;

    toast.success(`Update ready${version ? `: v${version}` : ''}`, {
      description: 'Restart to apply the update.',
      duration: Infinity,
      action: {
        label: 'Restart now',
        onClick: () => quitAndInstall(),
      },
      cancel: {
        label: 'Later',
        onClick: () => toast.info('Will install on next restart.'),
      },
    });
  }, [updateStatus, quitAndInstall]);

  return null;
}
