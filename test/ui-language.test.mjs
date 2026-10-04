/**
 * The app's chrome language.
 *
 * Most of what could go wrong here is already a build error. `ru` is declared as `typeof en`, so
 * a missing or misspelled key does not compile, and `TRANSLATIONS` is a `Record<UiLanguage, ...>`
 * so an enum member with no locale file does not either. What is left is what a type cannot see:
 *
 * - a stored code this build has no locale for, which would reach the lookup and come back
 *   `undefined` - an app with no text in it at all;
 * - the two enums drifting apart, the same failure `language.test.mjs` pins for the interview
 *   language;
 * - an entry copied from the row above it in the picker;
 * - and a Russian string that is still its English original. That one type-checks perfectly,
 *   ships, and is only ever found by a Russian speaker looking at the screen.
 */
import { codeOnly, createChecker, loadMain, readSource } from './helpers.mjs';

const CYRILLIC = /\p{Script=Cyrillic}/u;

/**
 * Strings in `ru.ts` that are correct without containing a Russian letter.
 *
 * Deliberately a list rather than a rule. Every entry is a claim that one specific string means
 * the same in both languages, which is occasionally true - an import path, a separator - and is
 * exactly the excuse an untranslated sentence would need, so each one is written out.
 */
const LANGUAGE_NEUTRAL = new Set(['./en']);

export async function run() {
  const { check, failures } = createChecker('ui-language');

  const { UiLanguage, DEFAULT_UI_LANGUAGE, resolveUiLanguage } =
    await loadMain('types/ui-language.js');
  const { configStore } = await loadMain('store/config.store.js');

  check('English is the default', DEFAULT_UI_LANGUAGE === 'en');
  check('Russian is offered', Object.values(UiLanguage).includes('ru'));
  check(
    'every code is a bare lowercase ISO 639-1 pair',
    Object.values(UiLanguage).every((code) => /^[a-z]{2}$/.test(code))
  );

  // Absent and unknown both resolve. The unknown case is a code some other build wrote to disk,
  // and it is the one that matters: `TRANSLATIONS[code]` for a code with no locale file is
  // `undefined`, and every `t.something.else` after it throws on first paint.
  check('absent resolves to English', resolveUiLanguage(undefined) === 'en');
  check('null resolves to English', resolveUiLanguage(null) === 'en');
  check('empty resolves to English', resolveUiLanguage('') === 'en');
  check('an unknown code resolves to English', resolveUiLanguage('kl') === 'en');
  // A regional variant resolves to English rather than to its base language, matching
  // `resolveLanguage`. Nothing writes one - the value only ever comes from this app's own picker
  // - and a resolver that accepted `ru-RU` would be claiming to handle locale strings it does
  // not, which is how `pt-BR` ends up silently served Portuguese-from-Portugal copy later.
  check('a regional variant resolves to English', resolveUiLanguage('ru-RU') === 'en');
  check('a known code is kept', resolveUiLanguage('ru') === 'ru');
  check('case and whitespace are normalised', resolveUiLanguage(' RU ') === 'ru');

  // The enum is mirrored into the renderer, which carries the endonyms the picker renders. Read
  // as text because the renderer is never built into electron-dist.
  const mirror = readSource(new URL('../src/renderer/types/ui-language.ts', import.meta.url));
  const mirrorCodes = [...mirror.matchAll(/^ {2}\w+ = '([a-z]{2})',$/gm)].map((m) => m[1]);
  check(
    'the renderer mirrors every code in the main enum',
    JSON.stringify(mirrorCodes.slice().sort()) ===
      JSON.stringify(Object.values(UiLanguage).slice().sort())
  );

  const entries = [...mirror.matchAll(/\{ code: UiLanguage\.(\w+), nativeName: '([^']*)' \}/g)].map(
    (m) => ({ member: m[1], nativeName: m[2] })
  );
  check('every picker entry parses', entries.length === mirrorCodes.length);
  check(
    'every entry carries an endonym',
    entries.every((entry) => entry.nativeName.length > 0)
  );
  check(
    'no two entries share an endonym',
    new Set(entries.map((entry) => entry.nativeName)).size === entries.length
  );
  check(
    'no two entries name the same enum member',
    new Set(entries.map((entry) => entry.member)).size === entries.length
  );
  check(
    'English is listed first, as the language the app falls back to',
    entries[0]?.member === 'English'
  );

  // A locale file per code. The `Record<UiLanguage, Translation>` in `i18n/index.ts` already
  // makes a missing one a build error; this says so in the suite that runs on a pull request,
  // where the message is about the locale rather than about an index signature.
  for (const code of Object.values(UiLanguage)) {
    let present = true;
    try {
      readSource(new URL(`../src/renderer/i18n/locales/${code}.ts`, import.meta.url));
    } catch {
      present = false;
    }
    check(`a locale file exists for ${code}`, present);
  }

  // The check a type cannot make. Every string the Russian locale ships has to have been
  // translated, and an untranslated one is indistinguishable from a translated one to the
  // compiler: both are `string`.
  const ruSource = codeOnly(
    readSource(new URL('../src/renderer/i18n/locales/ru.ts', import.meta.url))
  );
  const literals = [
    ...ruSource.matchAll(/'(?:[^'\\\n]|\\.)*'/g),
    ...ruSource.matchAll(/`(?:[^`\\]|\\.)*`/g),
  ].map((m) => m[0].slice(1, -1));

  check('the Russian locale has strings to check', literals.length > 20);

  const untranslated = literals.filter(
    (literal) => !CYRILLIC.test(literal) && !LANGUAGE_NEUTRAL.has(literal)
  );
  check(
    `every Russian string is in Russian${untranslated.length ? ` (left in English: ${untranslated.map((s) => JSON.stringify(s)).join(', ')})` : ''}`,
    untranslated.length === 0
  );

  // Interpolated values have to survive translation. A locale that drops one renders a sentence
  // with a hole in it, and a locale that renames one does not compile - so this covers the half
  // that does: the same number of `${}` slots per string as the English original.
  const enSource = codeOnly(
    readSource(new URL('../src/renderer/i18n/locales/en.ts', import.meta.url))
  );
  const slotCounts = (source) =>
    [...source.matchAll(/`(?:[^`\\]|\\.)*`/g)].map((m) => [...m[0].matchAll(/\$\{/g)].length);
  check(
    'every interpolated string keeps all of its values',
    JSON.stringify(slotCounts(enSource).slice().sort()) ===
      JSON.stringify(slotCounts(ruSource).slice().sort())
  );

  // The store is the single source for every consumer, so it is where an unknown code has to die
  // - `getConfig` resolves it on the way out, exactly as it does the interview language.
  configStore.updateConfig({ uiLanguage: 'ru' });
  check('a chosen UI language round-trips', configStore.getConfig().uiLanguage === 'ru');

  const raw = configStore.getStoredRuntime() ?? {};
  configStore.setStoredRuntime({ ...raw, uiLanguage: 'kl' });
  check(
    'getConfig resolves a stored UI language this build has no locale for',
    configStore.getConfig().uiLanguage === 'en'
  );

  // The two settings are independent, and the way that breaks is one of them being written as a
  // view of the other. Moving the interview language must leave the chrome where it was.
  configStore.updateConfig({ uiLanguage: 'ru', language: 'ja' });
  const both = configStore.getConfig();
  check(
    'the interview language and the chrome language are stored separately',
    both.uiLanguage === 'ru' && both.language === 'ja'
  );

  configStore.updateConfig({ uiLanguage: 'en', language: 'en' });

  return failures;
}
