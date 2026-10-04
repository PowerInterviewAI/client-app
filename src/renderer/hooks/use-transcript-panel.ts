import { useCallback } from 'react';
import { toast } from 'sonner';

import { currentTranslation } from '@/i18n';

import { useConfigStore } from './use-config-store';

/**
 * Visibility of the transcription dock, plus a toggle that persists the change.
 *
 * Shared by the control panel button and the global hotkey. The toggle reads the store
 * imperatively so it stays referentially stable, which lets the hotkey listener subscribe once
 * instead of resubscribing on every config change.
 */
export function useTranscriptPanel() {
  const { config } = useConfigStore();

  const toggle = useCallback(() => {
    const { config: current, updateConfig } = useConfigStore.getState();
    updateConfig({ showTranscriptPanel: current?.showTranscriptPanel === false }).catch((e) => {
      console.error('Failed to save transcription panel setting', e);
      toast.error(currentTranslation().settingsToasts.saveTranscriptPanelFailed);
    });
  }, []);

  return { visible: config?.showTranscriptPanel !== false, toggle };
}
