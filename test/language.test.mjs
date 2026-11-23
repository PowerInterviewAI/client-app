/**
 * The interview language decides which speech model transcribes the audio, and that failure is
 * silent: a model does not report a language it cannot handle, it returns confident words in one
 * it can for speech that was never in that language. So the two things worth pinning are
 * that a stored language actually reaches the request bodies, and that an unknown one resolves to
 * English here rather than travelling to the backend and the ASR URL.
 */
import { createChecker, loadMain, readSource } from './helpers.mjs';

const CODE = /^[a-z]{2,3}(-[a-z]{2})?$/;

export async function run() {
  const { check, failures } = createChecker('language');

  const { Language, DEFAULT_LANGUAGE, resolveLanguage, TTS_LANGUAGES } =
    await loadMain('types/language.js');
  const { transcriptSeparator } = await loadMain('utils/transcript-join.js');
  const { configStore } = await loadMain('store/config.store.js');

  check('English is the default', DEFAULT_LANGUAGE === 'en');

  // The set used to be pinned as a literal six, because that is all
  // universal-streaming-multilingual transcribes. The ceiling is now what the backend's Deepgram
  // provider streams, so the literal moved rather than the rule: the picker must never offer a
  // language the ASR cannot hear.
  check('English is in the set', Object.values(Language).includes('en'));
  // ISO 639-1 where one exists, ISO 639-3 where it does not (`ckb`, `kok`), and a region suffix
  // for the two Chinese variants. Lowercase throughout, because `resolveLanguage` lowercases what
  // it reads and a mixed-case value could never be matched.
  check(
    'every code is a lowercase 639-1 or 639-3 code, optionally with a region',
    Object.values(Language).every((code) => CODE.test(code))
  );
  check(
    'no code is listed twice',
    new Set(Object.values(Language)).size === Object.values(Language).length
  );

  // The enum is mirrored into the renderer, which carries the display metadata the picker reads.
  // Drift is the failure this catches, and it is silent in both directions: an enum member with
  // no renderer entry renders a blank trigger, and a renderer entry with no enum member is an
  // option that resolves straight back to English when picked. The renderer source is read as
  // text because it is never built into electron-dist, which is all `loadMain` can reach.
  const rendererSource = readSource(new URL('../src/renderer/types/language.ts', import.meta.url));
  const rendererCodes = [...rendererSource.matchAll(/code: Language\.\w+, name: '/g)].length;
  const rendererEnum = [...rendererSource.matchAll(/^  \w+ = '([a-z-]+)',$/gm)].map((m) => m[1]);

  check(
    'the renderer mirrors every code in the main enum',
    JSON.stringify(rendererEnum.slice().sort()) ===
      JSON.stringify(Object.values(Language).slice().sort())
  );
  check('the picker lists every language in the enum', rendererCodes === rendererEnum.length);

  // Parsed as whole entries rather than as columns, because the failures below are all
  // per-entry: a short label that belongs to the line above, a name left on a copied row.
  const memberCodes = new Map(
    [...rendererSource.matchAll(/^  (\w+) = '([a-z-]+)',$/gm)].map((m) => [m[1], m[2]])
  );
  const entries = [
    ...rendererSource.matchAll(
      /\{ code: Language\.(\w+), name: '([^']*)', nativeName: '([^']*)', short: '([^']*)', hasVoice: (true|false) \}/g
    ),
  ].map((m) => ({
    member: m[1],
    name: m[2],
    nativeName: m[3],
    short: m[4],
    hasVoice: m[5] === 'true',
    code: memberCodes.get(m[1]),
  }));

  check('every picker entry parses', entries.length === rendererEnum.length);
  check(
    'every picker entry names a member the enum has',
    entries.every((entry) => entry.code !== undefined)
  );

  // The one question the trigger answers at a glance is which language the session is set to.
  // `short` is the uppercased code rather than anything derived from the name - and a row copied
  // from the one above it keeps the wrong label, which shows the wrong language and reads as
  // correct. The two Chinese variants are the only exceptions, since `ZH-HK` is five characters.
  const SHORT_OVERRIDES = { 'zh-hk': 'YUE', 'zh-tw': 'ZHT' };
  check(
    'every short label is the uppercased code of its own entry',
    entries.every(
      (entry) => entry.short === (SHORT_OVERRIDES[entry.code] ?? entry.code?.toUpperCase())
    )
  );
  check(
    'every short label is two or three letters',
    entries.every((entry) => /^[A-Z]{2,3}$/.test(entry.short))
  );
  check(
    'no two entries share a short label',
    new Set(entries.map((entry) => entry.short)).size === entries.length
  );
  check(
    'every entry carries both a name and an endonym',
    entries.every((entry) => entry.name.length > 0 && entry.nativeName.length > 0)
  );

  // Display order is the order of the enum, deliberately: alphabetical differs per naming
  // column, so sorting by one leaves the other reading as scrambled.
  check(
    'the picker is listed in enum order',
    JSON.stringify(entries.map((entry) => entry.code)) === JSON.stringify(rendererEnum)
  );

  // Absent, blank and unknown all resolve rather than throwing or passing through. A code this
  // build does not know reaching the ASR URL is the case that matters: the backend can only fall
  // back anyway, and in the meantime the picker renders a blank trigger.
  check('absent resolves to English', resolveLanguage(undefined) === 'en');
  check('null resolves to English', resolveLanguage(null) === 'en');
  check('empty resolves to English', resolveLanguage('') === 'en');
  check('an unknown code resolves to English', resolveLanguage('kl') === 'en');
  check('a regional variant resolves to English', resolveLanguage('en-GB') === 'en');
  check('Cantonese is kept whole', resolveLanguage('zh-HK') === 'zh-hk');
  check('Traditional Mandarin is kept whole', resolveLanguage('zh-tw') === 'zh-tw');
  check('a known code is kept', resolveLanguage('es') === 'es');
  check('case and whitespace are normalised', resolveLanguage(' ES ') === 'es');

  // The backend already avoids putting spaces inside a Japanese utterance when it rejoins the
  // segments Deepgram froze. transcript.service.ts merges whole transcripts that landed within
  // TRANSCRIPT_INTER_TRANSCRIPT_GAP_MS of each other, and joining those with a space would put
  // the defect straight back - in the panel, and in the text the suggestion request carries.
  check('a spaced language merges with a space', transcriptSeparator('en') === ' ');
  check('Spanish merges with a space', transcriptSeparator('es') === ' ');
  check('Japanese merges with nothing', transcriptSeparator('ja') === '');
  check('Chinese merges with nothing', transcriptSeparator('zh') === '');
  check('Thai merges with nothing', transcriptSeparator('th') === '');
  check('Cantonese merges with nothing', transcriptSeparator('zh-hk') === '');
  check('Traditional Mandarin merges with nothing', transcriptSeparator('zh-tw') === '');
  check(
    'every unspaced language is one the picker actually offers',
    ['ja', 'zh', 'zh-hk', 'zh-tw', 'th'].every((code) => Object.values(Language).includes(code))
  );

  // Deepgram's Flux TTS speaks 44 of these 97 languages, mirroring the backend's
  // DEEPGRAM_TTS_VOICES map. Getting this wrong is quiet in both directions: a language wrongly
  // marked hasVoice sends a mock-interview /speak request that always comes back empty, and one
  // wrongly marked false denies a real voice to a user who has one.
  // prettier-ignore
  const ttsLanguages = new Set([
    'en', 'es', 'de', 'fr', 'pt', 'it', 'nl', 'pl', 'ru', 'uk', 'cs',
    'ro', 'el', 'hu', 'sv', 'da', 'no', 'fi', 'tr', 'hi', 'ja', 'ko',
    'zh', 'vi', 'id', 'bn', 'bg', 'ca', 'zh-hk', 'zh-tw', 'hr', 'et', 'gu',
    'kn', 'lv', 'lt', 'ms', 'mr', 'sk', 'sl', 'tl', 'ta', 'te', 'ur',
  ]);
  check(
    'hasVoice is exactly the 44 Flux-voiced languages',
    entries.every((entry) => entry.hasVoice === ttsLanguages.has(entry.code))
  );

  // Three tables have to agree on which languages Flux speaks, and only two of them were pinned.
  // The renderer's `hasVoice` above is display metadata - it draws the badge on the setup screen.
  // The backend's DEEPGRAM_TTS_VOICES is pinned by test_tts_language.py. This one, TTS_LANGUAGES,
  // is the decisive one: `installQuestion` reads it to set `hasAudio`, which is what decides
  // whether the session enters Speaking and asks for audio at all.
  //
  // Drift here is quiet, and the damaging direction is a language the backend voices going
  // missing from this set: the session never requests audio, so it is text-only for the rest of
  // the session while the setup screen still shows the "Voice" badge - no 204, no error, nothing
  // to see. The other direction recovers on its own (a /speak that answers 204 falls through
  // speechFailed to the text-only path), which is exactly why only this direction stays silent.
  check(
    'TTS_LANGUAGES is exactly the same 44 the picker marks as voiced',
    JSON.stringify([...TTS_LANGUAGES].sort()) === JSON.stringify([...ttsLanguages].sort())
  );

  // The store is the single source for every consumer, so it is where an unknown code has to die.
  configStore.updateConfig({ language: 'de' });
  check('a chosen language round-trips', configStore.getConfig().language === 'de');

  // Written straight to the raw object: updateConfig is typed, and the case being covered is a
  // value some other build left on disk.
  const raw = configStore.getStoredRuntime() ?? {};
  configStore.setStoredRuntime({ ...raw, language: 'kl' });
  check(
    'getConfig resolves a stored language this build does not know',
    configStore.getConfig().language === 'en'
  );

  configStore.updateConfig({ language: 'en' });

  return failures;
}
