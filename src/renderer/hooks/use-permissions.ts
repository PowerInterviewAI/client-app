import { useCallback, useEffect, useState } from 'react';

import { getElectron } from '@/lib/utils';

export type PermStatus = 'not-determined' | 'denied' | 'granted' | 'restricted' | 'unknown';

export interface PermissionsStatus {
  mic: PermStatus;
  screen: PermStatus;
}

const DEFAULT: PermissionsStatus = { mic: 'unknown', screen: 'unknown' };

export function usePermissions(active: boolean) {
  const [status, setStatus] = useState<PermissionsStatus>(DEFAULT);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    const electron = getElectron();
    if (!electron) return;
    setLoading(true);
    try {
      const result = await electron.permissions.checkAll();
      setStatus(result as PermissionsStatus);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    check();
    // Re-poll when window regains focus so returning from System Settings auto-updates the UI
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, [active, check]);

  const micOk = status.mic === 'granted';
  // macOS 14 (Sonoma): 'not-determined' for screen = dynamic picker handles it at capture time
  const screenOk = status.screen === 'granted' || status.screen === 'not-determined';
  const allGranted = micOk && screenOk;

  return { status, loading, allGranted, recheck: check };
}
