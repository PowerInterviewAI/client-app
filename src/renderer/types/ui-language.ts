/**
 * Mirrors `UiLanguage` in src/main/types/ui-language.ts, plus the metadata the picker renders.
 *
 * See that file for why the app's language and the interview's language are two settings.
 */
export enum UiLanguage {
  English = 'en',
  Russian = 'ru',
  Spanish = 'es',
  /** Written as Brazilian Portuguese. */
  Portuguese = 'pt',
  German = 'de',
  French = 'fr',
  /** Simplified Chinese, for Mainland China. */
  Chinese = 'zh',
  Japanese = 'ja',
  Korean = 'ko',
}

export const DEFAULT_UI_LANGUAGE = UiLanguage.English;

export interface UiLanguageOption {
  code: UiLanguage;
  /**
   * Endonym, and the only name shown.
   *
   * The interview picker shows both names because it is a list of 28 and someone scanning it may
   * not have found their own language yet. This list is short enough to read whole, and it is
   * read by someone whose app is currently in a language they may not speak - for whom the
   * endonym is the only one of the two names that helps. An English column beside it would be
   * the half of the row that user cannot use.
   */
  nativeName: string;
}

/**
 * English first, as the language the app falls back to; the rest alphabetical by endonym.
 *
 * Alphabetical by the name a language calls itself is the conventional order for a language
 * picker, and the one that serves the person reading it: someone whose app is in a language they
 * cannot read scans for the one name they recognise, and an order by popularity or market size
 * means nothing to them. Code-point order puts Latin scripts first, then Cyrillic, then CJK.
 */
export const UI_LANGUAGES: readonly UiLanguageOption[] = [
  { code: UiLanguage.English, nativeName: 'English' },
  { code: UiLanguage.German, nativeName: 'Deutsch' },
  { code: UiLanguage.Spanish, nativeName: 'Español' },
  { code: UiLanguage.French, nativeName: 'Français' },
  { code: UiLanguage.Portuguese, nativeName: 'Português (Brasil)' },
  { code: UiLanguage.Russian, nativeName: 'Русский' },
  { code: UiLanguage.Japanese, nativeName: '日本語' },
  { code: UiLanguage.Korean, nativeName: '한국어' },
  { code: UiLanguage.Chinese, nativeName: '中文' },
];

const BY_CODE = new Map<string, UiLanguageOption>(
  UI_LANGUAGES.map((option) => [option.code, option])
);

/** The option for a stored code, falling back to English for one this build does not know. */
export function getUiLanguageOption(code: string | null | undefined): UiLanguageOption {
  return (code ? BY_CODE.get(code) : undefined) ?? BY_CODE.get(DEFAULT_UI_LANGUAGE)!;
}

/** Same resolution the main process does, for a value read straight off the config store. */
export function resolveUiLanguage(raw: string | null | undefined): UiLanguage {
  const normalized = raw?.trim().toLowerCase();
  return normalized && BY_CODE.has(normalized) ? (normalized as UiLanguage) : DEFAULT_UI_LANGUAGE;
}
