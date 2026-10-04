import { useCallback } from 'react';

import { useUiLanguageCode } from '@/i18n';
import { getUiLanguageOption, type UiLanguage } from '@/types/ui-language';

import { useConfigStore } from './use-config-store';

/**
 * The app's chrome language, for the picker that sets it.
 *
 * Much less to it than `useInterviewLanguage`, and the difference is worth naming: the interview
 * language is a parameter of a live ASR connection, so changing it tears two sockets down and
 * re-opens them and the hook has to carry a switching state, a generation token and a failure
 * the user is owed an explanation for. This one is a local store write that re-renders the tree.
 * Nothing reconnects, nothing can half-apply, and there is no state to report.
 */
export function useUiLanguage() {
  const uiLanguage = useUiLanguageCode();
  const updateConfig = useConfigStore((s) => s.updateConfig);

  const setUiLanguage = useCallback(
    async (next: UiLanguage) => {
      if (next === uiLanguage) return;
      await updateConfig({ uiLanguage: next });
    },
    [uiLanguage, updateConfig]
  );

  return { uiLanguage, option: getUiLanguageOption(uiLanguage), setUiLanguage };
}
