import { useCallback } from 'react';
import { toast } from 'sonner';

import { useConfigStore } from './use-config-store';

/**
 * Whether a mock session also generates what the live assistant would have suggested, plus a
 * toggle that persists the change.
 *
 * Absent means **off**, the same direction `hintOnlyMode` is read in and the opposite of what
 * this setting used to do. A mock interview is for answering the question yourself, and a panel
 * of model-written answers beside the question while you are trying to think of your own is the
 * one thing most likely to stop that working - so it is opt-in, for the run where comparing your
 * answer against the assistant's is actually the point.
 */
export function useMockLiveSuggestions() {
  const { config } = useConfigStore();

  const toggle = useCallback(() => {
    const { config: current, updateConfig } = useConfigStore.getState();
    updateConfig({ mockLiveHintsEnabled: current?.mockLiveHintsEnabled !== true }).catch((e) => {
      console.error('Failed to save mock live suggestions setting', e);
      toast.error('Failed to save live suggestions setting');
    });
  }, []);

  return { enabled: config?.mockLiveHintsEnabled === true, toggle };
}
