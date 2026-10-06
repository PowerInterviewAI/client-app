import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

import { currentTranslation } from '@/i18n';
import { liveTranscriptionService, OutOfCreditsError } from '@/services/live-transcription.service';
import { getLanguageOption, type Language } from '@/types/language';

import { useConfigStore } from './use-config-store';

/**
 * The interview language, plus a setter that persists it and applies it to a running session.
 *
 * Resolved through `getLanguageOption` rather than read raw: the stored value is whatever some
 * build wrote to disk, and a code this build does not know would otherwise render as a blank
 * trigger on the control bar.
 *
 * The two halves can also end up disagreeing outright: suggestions follow immediately, and a
 * reconnect that fails leaves transcription on the old language while the menu shows the new one
 * with a check beside it. `reconnectFailed` keeps that visible after the toast has gone, because
 * the candidate reading answers in one language and a transcript in another has no other way to
 * tell which half moved.
 *
 * The two halves of the setting move at different speeds, and the setter is where that is
 * reconciled. Suggestions need nothing: each request reads the config store as it is built, so
 * the next one already follows the new language. The ASR sockets carry theirs as a connection
 * parameter, so they have to be torn down and re-opened - which takes a second or two and is why
 * `switching` exists rather than the change simply appearing to be instant.
 */
export function useInterviewLanguage() {
  const { config } = useConfigStore();
  const [switching, setSwitching] = useState(false);
  const [reconnectFailed, setReconnectFailed] = useState(false);
  const option = getLanguageOption(config?.language);

  // Bumped per switch, so a call that has been superseded cannot report its own outcome over the
  // one that replaced it. The menu's trigger is disabled while `switching`, which looks like it
  // makes this unreachable and does not: `switching` is only set *after* the config write below
  // is awaited, so a second pick lands in that gap. A superseded switch then returns through the
  // service's own generation guard - success, and up to a backoff delay later - which would
  // clear a warning the newer switch had already raised and re-enable the trigger under it.
  const switchSeq = useRef(0);

  const setLanguage = useCallback(async (language: Language) => {
    const { config: current, updateConfig } = useConfigStore.getState();
    if (current?.language === language) return;

    const seq = ++switchSeq.current;

    try {
      await updateConfig({ language });
    } catch (e) {
      console.error('Failed to save interview language', e);
      toast.error(currentTranslation().settingsToasts.saveLanguageFailed);
      return;
    }

    // Persisted first, reconnected second. If the reconnect fails the setting still stands and
    // the channel keeps retrying on it; rolling the setting back would leave the user with no
    // way to reach the language they picked.
    setSwitching(true);
    try {
      await liveTranscriptionService.setLanguage(language);
      if (seq !== switchSeq.current) return;
      // Cleared on success, so a retry that works takes the warning down with it.
      setReconnectFailed(false);
    } catch (e) {
      if (seq !== switchSeq.current) return;
      // Refused for credits: the session is ending, and the out-of-credits stop says so. Warning
      // that the language only half applied would be both wrong and a second toast.
      if (e instanceof OutOfCreditsError) return;
      console.error('Failed to switch transcription language', e);
      setReconnectFailed(true);
      const t = currentTranslation();
      toast.warning(t.settingsToasts.languageHalfApplied, {
        description: t.settingsToasts.languageHalfAppliedHint,
      });
    } finally {
      // Left set by a superseded switch: the one that replaced it is still in flight, and the
      // spinner belongs to that one until it finishes.
      if (seq === switchSeq.current) setSwitching(false);
    }
  }, []);

  /**
   * Drop the warning without changing the language.
   *
   * The half-applied state only exists for the life of the session that produced it: the next
   * start opens both sockets on the stored language. Leaving the warning up past a stop would
   * describe something that is no longer true.
   */
  const clearReconnectFailed = useCallback(() => setReconnectFailed(false), []);

  return {
    language: option.code,
    option,
    switching,
    reconnectFailed,
    setLanguage,
    clearReconnectFailed,
  };
}
