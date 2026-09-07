/**
 * The language an interview runs in: what the ASR transcribes and what suggestions come back in.
 *
 * ISO 639-1 codes, mirroring `Language` in the backend's `app/schemas/language.py`, which is
 * exactly what its Deepgram Nova-3 ASR streams. Deliberately no wider than that: offering a
 * language the transcription cannot deliver produces confident answers to a question that was
 * never asked, which is worse than not offering it.
 *
 * A code this build knows but an older backend does not is resolved back to English there rather
 * than faked, so a client ahead of its backend degrades one session instead of breaking it.
 *
 * `src/renderer/types/language.ts` carries the same enum plus the display metadata the picker
 * needs, the way `SuggestionMode` is mirrored across the two processes.
 */
export enum Language {
  English = 'en',
  Spanish = 'es',
  German = 'de',
  French = 'fr',
  Portuguese = 'pt',
  Italian = 'it',
  Dutch = 'nl',
  Polish = 'pl',
  Russian = 'ru',
  Ukrainian = 'uk',
  Czech = 'cs',
  Romanian = 'ro',
  Greek = 'el',
  Hungarian = 'hu',
  Swedish = 'sv',
  Danish = 'da',
  Norwegian = 'no',
  Finnish = 'fi',
  Turkish = 'tr',
  Hindi = 'hi',
  Japanese = 'ja',
  Korean = 'ko',
  Chinese = 'zh',
  Vietnamese = 'vi',
  Thai = 'th',
  Indonesian = 'id',
  Arabic = 'ar',
  Hebrew = 'he',
}

export const DEFAULT_LANGUAGE = Language.English;

const LANGUAGE_CODES = new Set<string>(Object.values(Language));

/**
 * Languages Deepgram's Aura TTS can speak, mirroring the backend's `DEEPGRAM_TTS_VOICES` in
 * `app/schemas/language.py`. A local fast-skip only - the backend stays the authority and answers
 * `204` for anything not in its own map, so a client ahead of or behind this list still degrades
 * to text-only rather than breaking. Kept here so main does not fire a `/speak` request it
 * already knows will come back empty.
 */
export const TTS_LANGUAGES: ReadonlySet<Language> = new Set([
  Language.English,
  Language.Spanish,
  Language.German,
  Language.French,
  Language.Dutch,
  Language.Italian,
  Language.Japanese,
]);

/**
 * Map a stored or incoming value onto the enum, falling back to English.
 *
 * The config store holds whatever was written to disk, which may be a language a later build
 * removed or an older build never knew. Sending that through unchecked puts an unknown code on
 * the ASR URL and in every request body, where the backend can only fall back anyway - so it
 * resolves here, once, at the point the value leaves the store.
 */
export function resolveLanguage(raw: string | null | undefined): Language {
  if (!raw) return DEFAULT_LANGUAGE;

  const normalized = raw.trim().toLowerCase();
  return LANGUAGE_CODES.has(normalized) ? (normalized as Language) : DEFAULT_LANGUAGE;
}
