import { useCallback } from 'react';
import { toast } from 'sonner';

import { useConfigStore } from './use-config-store';

/**
 * Whether a mock session also generates what the live assistant would have suggested, plus a
 * toggle that persists the change.
 *
 * Absent means **on**, the same direction `hintOnlyMode` is read in, and the main-process store
 * backfills the same default - so the two sides agree about a config written before the setting
 * existed. Turning it off is what a candidate does for the run where composing the answer
 * unaided is the point, and it is asked in the first-run wizard rather than only discoverable
 * on the session bar.
 *
 * Shared by the session bar, the configuration page and the onboarding wizard. `toggle` reads
 * the store imperatively so it stays referentially stable.
 */
export function useMockLiveSuggestions() {
  const { config } = useConfigStore();

  const persist = useCallback((enabled: boolean) => {
    const { updateConfig } = useConfigStore.getState();
    updateConfig({ mockLiveHintsEnabled: enabled }).catch((e) => {
      console.error('Failed to save mock live suggestions setting', e);
      toast.error('Failed to save live suggestions setting');
    });
  }, []);

  const toggle = useCallback(() => {
    const { config: current } = useConfigStore.getState();
    persist(current?.mockLiveHintsEnabled === false);
  }, [persist]);

  return { enabled: config?.mockLiveHintsEnabled !== false, setEnabled: persist, toggle };
}
