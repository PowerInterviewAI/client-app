import { useEffect } from 'react';

import { useConfigStore } from '@/hooks/use-config-store';
import { DEFAULT_UI_LANGUAGE, resolveUiLanguage, UiLanguage } from '@/types/ui-language';

import { en, type Translation } from './locales/en';
import { ru } from './locales/ru';

export type { Translation };

const TRANSLATIONS: Record<UiLanguage, Translation> = {
  [UiLanguage.English]: en,
  [UiLanguage.Russian]: ru,
};

/** The dictionary for a code, for the few callers that have one in hand rather than a hook. */
export function translationFor(code: string | null | undefined): Translation {
  return TRANSLATIONS[resolveUiLanguage(code)];
}

/**
 * Where the chosen language is cached for the next launch's first paint.
 *
 * The config store is the durable copy and the only one anything writes on purpose. But it is
 * loaded over IPC from an effect in `MainFrame`, so for the first frames of every launch
 * `config` is `undefined` - and a Russian install would open in English and then switch, which
 * is the one moment a user is most likely to be deciding whether the app is translated at all.
 * This is read synchronously at module load to cover that gap, the same way the theme is.
 *
 * Deliberately not authoritative: it is only ever read when the store has not answered yet, so a
 * stale or hand-edited value survives for a few frames rather than overriding the real setting.
 */
const CACHE_KEY = 'uiLanguage';

function readCache(): UiLanguage {
  // Throws rather than returning null in a private window or with site data blocked, and this
  // runs at module load, where an exception would take the whole renderer down.
  try {
    return resolveUiLanguage(localStorage.getItem(CACHE_KEY));
  } catch {
    return DEFAULT_UI_LANGUAGE;
  }
}

let paintTimeLanguage = readCache();

/** The UI language in force, falling back to the paint-time cache until the config arrives. */
export function useUiLanguageCode(): UiLanguage {
  const stored = useConfigStore((s) => s.config?.uiLanguage);
  return stored ? resolveUiLanguage(stored) : paintTimeLanguage;
}

/**
 * The strings for the current UI language.
 *
 * Returns the whole dictionary rather than a lookup function, so every string is reached as a
 * property (`t.common.cancel`) and a typo is a build error. The returned object is a module
 * constant, so this does not re-render anything on its own.
 */
export function useT(): Translation {
  return TRANSLATIONS[useUiLanguageCode()];
}

/**
 * The dictionary, read at the moment it is needed rather than through a hook.
 *
 * Several of the setting hooks deliberately keep their callbacks referentially stable, and say
 * so: the global hotkey listeners subscribe to them once instead of resubscribing on every
 * config change. `useT()` inside such a callback would leave it holding whichever dictionary was
 * current when the callback was created, and adding `t` to the dependency array would defeat the
 * stability those comments describe. This reads the language the same way those callbacks
 * already read the config, so it is always current and costs no dependency.
 *
 * Also what the handful of non-component callers use - `showExportSuccessToast` and the zustand
 * store in `use-assistant-service`, neither of which can call a hook at all.
 */
export function currentTranslation(): Translation {
  return translationFor(useConfigStore.getState().config?.uiLanguage);
}

/**
 * Keep the paint-time cache and the document's `lang` in step with the setting.
 *
 * Mounted once, in `MainFrame`. `lang` is not decoration: it picks the font fallback and the
 * hyphenation dictionary the renderer uses, and it is what a screen reader reads the chrome with
 * - an interface announced in English while it is written in Russian is unusable rather than
 * merely wrong.
 */
export function useUiLanguageSync(): void {
  const code = useUiLanguageCode();

  useEffect(() => {
    document.documentElement.lang = code;
    paintTimeLanguage = code;
    try {
      localStorage.setItem(CACHE_KEY, code);
    } catch {
      // A cache miss next launch costs one frame of English. Nothing to report.
    }
  }, [code]);
}
