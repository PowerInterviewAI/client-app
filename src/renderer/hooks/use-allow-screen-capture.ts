import { useCallback } from 'react';
import { toast } from 'sonner';

import { currentTranslation } from '@/i18n';

import { useConfigStore } from './use-config-store';

/** Whether the main window may appear in screen capture outside stealth, plus a persisting setter. */
export function useAllowScreenCapture() {
  const { config } = useConfigStore();

  const setEnabled = useCallback((enabled: boolean) => {
    const { updateConfig } = useConfigStore.getState();
    updateConfig({ allowScreenCapture: enabled }).catch((e) => {
      console.error('Failed to save screen capture setting', e);
      toast.error(currentTranslation().settingsToasts.saveAllowScreenCaptureFailed);
    });
  }, []);

  return { enabled: config?.allowScreenCapture === true, setEnabled };
}
