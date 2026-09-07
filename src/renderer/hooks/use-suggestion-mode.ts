import { useCallback } from 'react';
import { toast } from 'sonner';

import { useConfigStore } from './use-config-store';

/**
 * Which of the two suggestion modes is in force, plus setters that persist a change.
 *
 * Hint-only is a headline and keyword bullets, meant to be read at a glance while the candidate
 * is talking. Full-sentence is the answer written out as it would be spoken. Hint-only is the
 * default, so an absent value reads as on - an install that predates the default keeps whatever
 * it was left on, which the main-process config store's migration carries across.
 *
 * Shared by the control panel button, the configuration page, the onboarding wizard and the
 * global hotkey. `toggle` reads the store imperatively so it stays referentially stable, which
 * lets the hotkey listener subscribe once instead of resubscribing on every config change.
 */
export function useSuggestionMode() {
  const { config } = useConfigStore();

  const persist = useCallback((hintOnly: boolean) => {
    const { updateConfig } = useConfigStore.getState();
    updateConfig({ hintOnlyMode: hintOnly }).catch((e) => {
      console.error('Failed to save the suggestion mode', e);
      toast.error('Failed to save the suggestion mode');
    });
  }, []);

  const toggle = useCallback(() => {
    const { config: current } = useConfigStore.getState();
    persist(current?.hintOnlyMode === false);
  }, [persist]);

  return { hintOnly: config?.hintOnlyMode !== false, setHintOnly: persist, toggle };
}
