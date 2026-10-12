import { useCallback } from 'react';
import { toast } from 'sonner';

import { currentTranslation } from '@/i18n';

import { useConfigStore } from './use-config-store';

/** Whether the app hides its taskbar/Dock icon during a live interview, plus a persisting setter. */
export function useHideTaskbar() {
  const { config } = useConfigStore();

  const setEnabled = useCallback((enabled: boolean) => {
    const { updateConfig } = useConfigStore.getState();
    updateConfig({ hideTaskbarWhileRunning: enabled }).catch((e) => {
      console.error('Failed to save hide taskbar setting', e);
      toast.error(currentTranslation().settingsToasts.saveHideTaskbarFailed);
    });
  }, []);

  return { enabled: config?.hideTaskbarWhileRunning === true, setEnabled };
}
