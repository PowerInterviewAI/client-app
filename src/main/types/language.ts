/**
 * The language an interview runs in: what the ASR transcribes and what suggestions come back in.
 *
 * Lowercase language codes, mirroring `Language` in the backend's `app/schemas/language.py`, which
 * is every language its Deepgram Nova-3 ASR streams as a monolingual model: ISO 639-1 where one
 * exists, ISO 639-3 where it does not (`ckb`, `kok`), and `zh-hk` / `zh-tw` for Cantonese and
 * Traditional Mandarin. Lowercase because `resolveLanguage` lowercases what it reads. Deliberately
 * no wider than the ASR: offering a language the transcription cannot deliver produces confident
 * answers to a question that was never asked, which is worse than not offering it.
 *
 * A code this build knows but an older backend does not is resolved back to English on the ASR
 * socket, but suggestion and mock request bodies are validated strictly and answer 422 - so a
 * release that adds languages ships after the backend that knows them, not before.
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
  Abkhazian = 'ab',
  Adyghe = 'ady',
  Afrikaans = 'af',
  Akan = 'ak',
  Albanian = 'sq',
  Amharic = 'am',
  Armenian = 'hy',
  Assamese = 'as',
  Azerbaijani = 'az',
  Basque = 'eu',
  Belarusian = 'be',
  Bengali = 'bn',
  Bodo = 'brx',
  Bosnian = 'bs',
  Bulgarian = 'bg',
  Catalan = 'ca',
  CentralKurdish = 'ckb',
  Cantonese = 'zh-hk',
  ChineseTraditional = 'zh-tw',
  Croatian = 'hr',
  Divehi = 'dv',
  EasternMari = 'mhr',
  Estonian = 'et',
  Galician = 'gl',
  Georgian = 'ka',
  Gujarati = 'gu',
  Hausa = 'ha',
  Icelandic = 'is',
  Kabardian = 'kbd',
  Kabyle = 'kab',
  Kalenjin = 'kln',
  Kannada = 'kn',
  Kashmiri = 'ks',
  Kazakh = 'kk',
  Kinyarwanda = 'rw',
  Konkani = 'kok',
  Kyrgyz = 'ky',
  Latvian = 'lv',
  Lithuanian = 'lt',
  Luganda = 'lg',
  Luo = 'luo',
  Macedonian = 'mk',
  Malay = 'ms',
  Malayalam = 'ml',
  Marathi = 'mr',
  Mongolian = 'mn',
  Nepali = 'ne',
  NorthernKurdish = 'kmr',
  Pashto = 'ps',
  Persian = 'fa',
  Punjabi = 'pa',
  Serbian = 'sr',
  Sindhi = 'sd',
  Sinhala = 'si',
  Slovak = 'sk',
  Slovenian = 'sl',
  Swahili = 'sw',
  Tagalog = 'tl',
  Taita = 'dav',
  Tamil = 'ta',
  Telugu = 'te',
  Tswana = 'tn',
  Urdu = 'ur',
  Uyghur = 'ug',
  Uzbek = 'uz',
  Venda = 've',
  Welsh = 'cy',
  Yoruba = 'yo',
  Zulu = 'zu',
}

export const DEFAULT_LANGUAGE = Language.English;

const LANGUAGE_CODES = new Set<string>(Object.values(Language));

/**
 * Languages Deepgram's Flux TTS can speak, mirroring the backend's `DEEPGRAM_TTS_VOICES` in
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
  Language.Portuguese,
  Language.Italian,
  Language.Dutch,
  Language.Polish,
  Language.Russian,
  Language.Ukrainian,
  Language.Czech,
  Language.Romanian,
  Language.Greek,
  Language.Hungarian,
  Language.Swedish,
  Language.Danish,
  Language.Norwegian,
  Language.Finnish,
  Language.Turkish,
  Language.Hindi,
  Language.Japanese,
  Language.Korean,
  Language.Chinese,
  Language.Vietnamese,
  Language.Indonesian,
  Language.Bengali,
  Language.Bulgarian,
  Language.Catalan,
  Language.Cantonese,
  Language.ChineseTraditional,
  Language.Croatian,
  Language.Estonian,
  Language.Gujarati,
  Language.Kannada,
  Language.Latvian,
  Language.Lithuanian,
  Language.Malay,
  Language.Marathi,
  Language.Slovak,
  Language.Slovenian,
  Language.Tagalog,
  Language.Tamil,
  Language.Telugu,
  Language.Urdu,
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
