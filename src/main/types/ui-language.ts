/**
 * The language the app's own chrome is written in: buttons, headings, dialogs, toasts.
 *
 * Deliberately not the same setting as `Language` in ./language.ts, which is the language the
 * *interview* runs in. The two answer different questions and routinely disagree: a Russian
 * speaker interviewing in English wants an English transcript and a Russian app, and inferring
 * either from the other gets that user wrong in one direction or the other. So this is asked
 * outright - the first step of the first-run wizard - and never derived.
 *
 * Narrow on purpose. A language belongs here once the chrome is actually translated into it,
 * which is a file in `src/renderer/i18n/locales` rather than a code in a list; offering one
 * without that file is offering a UI that falls back to English everywhere it matters.
 *
 * `src/renderer/types/ui-language.ts` carries the same enum plus the display metadata the picker
 * needs, the way `Language` and `SuggestionMode` are mirrored across the two processes.
 */
export enum UiLanguage {
  English = 'en',
  Russian = 'ru',
}

export const DEFAULT_UI_LANGUAGE = UiLanguage.English;

const UI_LANGUAGE_CODES = new Set<string>(Object.values(UiLanguage));

/**
 * Map a stored or incoming value onto the enum, falling back to English.
 *
 * Same job `resolveLanguage` does for the interview language and for the same reason: the disk
 * holds whatever some build wrote, and a locale this build has no translation file for must
 * resolve to one it does rather than reaching a lookup that would come back undefined.
 */
export function resolveUiLanguage(raw: string | null | undefined): UiLanguage {
  if (!raw) return DEFAULT_UI_LANGUAGE;

  const normalized = raw.trim().toLowerCase();
  return UI_LANGUAGE_CODES.has(normalized) ? (normalized as UiLanguage) : DEFAULT_UI_LANGUAGE;
}
