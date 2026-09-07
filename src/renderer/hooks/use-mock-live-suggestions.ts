import { useCallback } from 'react';
import { toast } from 'sonner';

import { useConfigStore } from './use-config-store';

/**
 * Whether a mock session also generates what the live assistant would have suggested, plus a
 * toggle that persists the change.
 *
 * Absent means on, unlike `useSuggestionMode` - trying this out is one of the two reasons the
 * mock interview feature exists, alongside practising the interview itself, so the panel is
 * discoverable by default rather than opt-in.
 */
export function useMockLiveSuggestions() {
  const { config } = useConfigStore();

  const toggle = useCallback(() => {
    const { config: current, updateConfig } = useConfigStore.getState();
    updateConfig({
      mockLiveSuggestionsEnabled: current?.mockLiveSuggestionsEnabled === false,
    }).catch((e) => {
      console.error('Failed to save mock live suggestions setting', e);
      toast.error('Failed to save live suggestions setting');
    });
  }, []);

  return { enabled: config?.mockLiveSuggestionsEnabled !== false, toggle };
}
