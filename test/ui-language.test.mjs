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
 * Strings in `ru.ts` that hold Latin letters on purpose.
 *
 * Deliberately a list rather than a rule. Every entry is a claim that one specific string is
 * correct in Latin script, which is occasionally true - a brand name, a file format, an import
 * path - and is exactly the excuse an untranslated sentence would need, so each one is written
 * out and has to be added by hand.
 */
const LATIN_BY_DESIGN = new Set([
  // The import specifier the locale's type comes from.
  './en',
  // The BCP-47 tag handed to `toLocaleString`, which is how a Russian locale groups thousands.
  'ru-RU',
  // Format names. Russian technical writing keeps both, and the file extension is not a word.
  'Markdown',
  'Word',
  'Markdown (.md)',
  // Seniority levels. Russian-language job postings and recruiters use these in Latin script
  // almost without exception, so translating them would make the picker read as a translation
  // of a job ad rather than as one.
  'Junior',
  'Middle',
  'Senior',
  'Staff+',
  // A domain.
  'powerinterviewai.com/docs',
  // Purchasable SKUs. `Pro` in particular is a plan a user has bought by that name, so the
  // three stay as the brand's own words - only their descriptions are prose.
  'Starter',
  'Pro',
  'Enterprise',
]);

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

  // The check a type cannot make. Every sentence the Russian locale ships has to have been
  // translated, and an untranslated one is indistinguishable from a translated one to the
  // compiler: both are `string`.
  //
  // The test is Latin letters with no Cyrillic anywhere in the same string, rather than "no
  // Cyrillic": a literal with no letters at all - a separator, a template that is nothing but
  // its own interpolations - has nothing in it to translate, and flagging those would train
  // whoever hits it to widen the allowlist rather than read it.
  const ruSource = codeOnly(
    readSource(new URL('../src/renderer/i18n/locales/ru.ts', import.meta.url))
  );
  const literals = [
    ...ruSource.matchAll(/'(?:[^'\\\n]|\\.)*'(\s*:)?/g),
    ...ruSource.matchAll(/`(?:[^`\\]|\\.)*`(\s*:)?/g),
  ]
    // A quoted property name is a key, not copy. `'mock-done'` is quoted only because of the
    // hyphen, and it has to match `en.ts` exactly rather than being translated.
    .filter((m) => m[1] === undefined)
    .map((m) => m[0].slice(1, -1))
    // `${...}` holds an identifier, not copy. `withCombo` is `` `${label} (${combo})` `` in both
    // locales and correctly has no words of its own; left in, those two parameter names would
    // read as untranslated English.
    .map((literal) => literal.replace(/\$\{[^}]*\}/g, ''));

  check('the Russian locale has strings to check', literals.length > 100);

  const untranslated = literals.filter(
    (literal) =>
      /\p{Script=Latin}/u.test(literal) &&
      !/\p{Script=Cyrillic}/u.test(literal) &&
      !LATIN_BY_DESIGN.has(literal)
  );
  check(
    `every Russian string is in Russian${untranslated.length ? ` (left in English: ${untranslated.map((s) => JSON.stringify(s)).join(', ')})` : ''}`,
    untranslated.length === 0
  );

  // Interpolated values surviving translation is pinned by the compiler rather than here.
  // `noUnusedParameters` is on in tsconfig.app.json, so a locale that takes `(email: string)`
  // and then writes a sentence without it fails the build - which is a better check than
  // counting `${}` slots per string, since a locale may legitimately add one: Russian's
  // `charactersLeft` interpolates the plural form as well as the number.

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

  // Main has its own share of the chrome - the placeholder panel copy it seeds, and the push
  // notifications it raises as toasts from paths the renderer cannot see. `UiStrings` makes a
  // missing key a build error and `Record<UiLanguage, UiStrings>` makes a missing language one,
  // so what is left is the same thing the renderer locale's check covers: a Russian entry that
  // is still its English original.
  const mainSource = codeOnly(
    readSource(new URL('../src/main/utils/ui-strings.ts', import.meta.url))
  );
  const russianBlock = mainSource.slice(mainSource.indexOf('[UiLanguage.Russian]:'));
  const mainLiterals = [
    ...russianBlock.matchAll(/'(?:[^'\\\n]|\\.)*'(\s*:)?/g),
    ...russianBlock.matchAll(/`(?:[^`\\]|\\.)*`(\s*:)?/g),
  ]
    .filter((m) => m[1] === undefined)
    .map((m) => m[0].slice(1, -1))
    .map((literal) => literal.replace(/\$\{[^}]*\}/g, ''));

  check('the main-process table has strings to check', mainLiterals.length > 10);

  const mainUntranslated = mainLiterals.filter(
    (literal) =>
      /\p{Script=Latin}/u.test(literal) &&
      !/\p{Script=Cyrillic}/u.test(literal) &&
      !LATIN_BY_DESIGN.has(literal)
  );
  check(
    `every Russian main-process string is in Russian${mainUntranslated.length ? ` (left in English: ${mainUntranslated.map((s) => JSON.stringify(s)).join(', ')})` : ''}`,
    mainUntranslated.length === 0
  );

  // `uiStrings()` reads the store per call rather than capturing once, because the paths it
  // serves - a health-check poll, a global hotkey handler - outlive any one setting.
  const { uiStrings } = await loadMain('utils/ui-strings.js');
  check(
    'uiStrings follows the stored language',
    /^Transcripts/.test(uiStrings().placeholderTranscript)
  );
  configStore.updateConfig({ uiLanguage: 'ru' });
  check(
    'and follows it again once it moves',
    /\p{Script=Cyrillic}/u.test(uiStrings().placeholderTranscript)
  );

  // The placeholder is written on launch and after a Clear, so a language changed between those
  // two would leave English sample copy in the panels of an otherwise Russian app. Driven here
  // rather than left to a code read, because the no-op half is the half that matters: once a
  // real interview has written to the history, re-seeding would throw it away.
  const { appStateService } = await loadMain('services/app-state.service.js');
  appStateService.refreshPlaceholderLanguage();
  check(
    'a chrome language change re-seeds the placeholder copy',
    /\p{Script=Cyrillic}/u.test(appStateService.getState().transcripts[0]?.text ?? '')
  );

  appStateService.updateState({ transcripts: [], liveSuggestions: [], actionSuggestions: [] });
  appStateService.refreshPlaceholderLanguage();
  check(
    'and is a no-op once the placeholder has been retired',
    appStateService.getState().transcripts.length === 0
  );

  // Two slots on the control bar are a fixed width with no truncation, so a label that does not
  // fit does not clip - it wraps, and the control gets taller. Both sit in single-row layouts
  // where that moves everything beside them, and `RunningIndicator` is the only thing on screen
  // at all in stealth mode. Russian found this once already (`ОСТАНОВКА` against a 96px badge),
  // and the next locale will find it again, so the budget is written down rather than measured
  // by eye each time.
  //
  // Character counts rather than pixels, which is what a test can actually see. 10 is `w-28`
  // (112px) less the dot and the padding, at text-xs bold uppercase; 8 is `w-24` less the icon.
  const SLOT_BUDGETS = [
    { block: 'runningIndicator', keys: ['idle', 'starting', 'running', 'stopping'], max: 10 },
    { block: 'controlPanel', keys: ['stop'], max: 8 },
  ];

  for (const locale of Object.values(UiLanguage)) {
    const localeSource = codeOnly(
      readSource(new URL(`../src/renderer/i18n/locales/${locale}.ts`, import.meta.url))
    );
    for (const { block, keys, max } of SLOT_BUDGETS) {
      const start = localeSource.indexOf(`\n  ${block}: {`);
      const body = localeSource.slice(start, localeSource.indexOf('\n  },', start));
      for (const key of keys) {
        const m = body.match(new RegExp(`\\b${key}: '([^']*)',`));
        check(
          `${locale}.${block}.${key} fits its fixed-width slot${m ? ` ("${m[1]}", ${m[1].length}/${max})` : ' (not found)'}`,
          m !== null && m[1].length <= max
        );
      }
    }
  }

  // Restored for the tests after this one, which read the placeholder in English and assume the
  // state a freshly constructed service is in.
  configStore.updateConfig({ uiLanguage: 'en' });
  appStateService.setPlaceholderState();

  return failures;
}
