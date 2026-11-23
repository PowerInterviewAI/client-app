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
import { codeOnly, createChecker, loadMain, loadMainAs, readSource } from './helpers.mjs';

/**
 * Strings in a non-Latin locale that hold Latin letters on purpose.
 *
 * Deliberately a list rather than a rule. Every entry is a claim that one specific string is
 * correct in Latin script, which is occasionally true - a brand name, a file format, an import
 * path - and is exactly the excuse an untranslated sentence would need, so each one is written
 * out and has to be added by hand.
 */
const LATIN_BY_DESIGN = new Set([
  // The import specifier the locale's type comes from.
  './en',
  // The BCP-47 tags handed to `toLocaleString`, which is how each locale formats its numbers
  // and dates.
  'ru-RU',
  'ja-JP',
  'ko-KR',
  'zh-CN',
  // `Intl.DateTimeFormat` option values, which are part of the API rather than copy.
  '2-digit',
  'h23',
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
  // Unit symbols around two interpolated numbers, the same in every Latin-script locale and
  // written in Latin by convention in the CJK ones.
  ' MB /  MB',
  // A domain.
  'powerinterviewai.com/docs',
  // Purchasable SKUs. `Pro` in particular is a plan a user has bought by that name, so the
  // three stay as the brand's own words - only their descriptions are prose.
  'Starter',
  'Pro',
  'Enterprise',
]);

/**
 * The script a locale's own words are written in, for the locales that are not written in Latin.
 *
 * For these the test is "Latin letters and none of the locale's own script in the same string": a
 * literal with no letters at all - a separator, a template that is only its interpolations - has
 * nothing to translate, and flagging those would train whoever hits it to widen the allowlist
 * rather than read it. Japanese counts kana and kanji, since a short Japanese label can be all
 * kanji; Korean counts Hangul alone.
 */
const NATIVE_SCRIPT = {
  ru: /\p{Script=Cyrillic}/u,
  ja: /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u,
  ko: /\p{Script=Hangul}/u,
  zh: /\p{Script=Han}/u,
};

/**
 * Words that are spelled the same in a Latin-script locale as in English and are correct there.
 *
 * A Latin-script locale cannot be checked by script, so it is checked against the English source
 * instead: a string identical to an English one is flagged. These are the exceptions, per locale,
 * and every one is a claim that the word really is that language's own - Spanish and Portuguese
 * write "Plan" and "Status" too, German uses "Start". Listed by hand for the same reason as
 * `LATIN_BY_DESIGN`.
 */
const SAME_AS_ENGLISH = {
  // `min` is the Spanish abbreviation for minutes as well.
  es: new Set(['Plan', 'General', ' min']),
  pt: new Set([' min']),
  fr: new Set([
    'Suggestions',
    'Transcription',
    'Standard',
    'Excellent',
    'Action',
    'minutes',
    ' min',
  ]),
};

/**
 * The string literals in a TypeScript source, as written, minus keys and interpolations.
 *
 * A quoted property name is a key, not copy: `'mock-done'` is quoted only because of the hyphen,
 * and it has to match `en.ts` exactly rather than being translated. `${...}` holds an identifier,
 * not copy: `withCombo` is `` `${label} (${combo})` `` in every locale and correctly has no words of
 * its own.
 */
function literalsOf(source) {
  const code = codeOnly(source);
  return [
    ...code.matchAll(/'(?:[^'\\\n]|\\.)*'(\s*:)?/g),
    ...code.matchAll(/`(?:[^`\\]|\\.)*`(\s*:)?/g),
  ]
    .filter((m) => m[1] === undefined)
    .map((m) => m[0].slice(1, -1))
    .map((literal) => literal.replace(/\$\{[^}]*\}/g, ''));
}

function isUntranslated(code, literal, englishLiterals) {
  if (!/\p{Script=Latin}/u.test(literal) || LATIN_BY_DESIGN.has(literal)) return false;
  const native = NATIVE_SCRIPT[code];
  if (native) return !native.test(literal);
  return englishLiterals.has(literal) && !SAME_AS_ENGLISH[code]?.has(literal);
}

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

  // The check a type cannot make. Every sentence a locale ships has to have been translated, and
  // an untranslated one is indistinguishable from a translated one to the compiler: both are
  // `string`. Run for every locale, because the next one is the one nobody reads.
  const enLiterals = new Set(
    literalsOf(readSource(new URL('../src/renderer/i18n/locales/en.ts', import.meta.url)))
  );
  for (const code of Object.values(UiLanguage)) {
    if (code === 'en') continue;
    const literals = literalsOf(
      readSource(new URL(`../src/renderer/i18n/locales/${code}.ts`, import.meta.url))
    );
    check(`the ${code} locale has strings to check`, literals.length > 100);
    const untranslated = literals.filter((literal) => isUntranslated(code, literal, enLiterals));
    check(
      `every ${code} string is translated${untranslated.length ? ` (left in English: ${untranslated.map((s) => JSON.stringify(s)).join(', ')})` : ''}`,
      untranslated.length === 0
    );
  }

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

  // The store's migration backfills `uiLanguage` for an install that predates it, and the way
  // that goes wrong is the way it went wrong for `autoScroll` once already: written
  // unconditionally rather than only when the key is absent, so every launch resets the user's
  // choice. A Russian install reverting to English on every start, with nothing to see but the
  // language moving.
  //
  // Driven by loading a second copy of the module, which re-runs its import-time migration
  // against whatever is on disk. The platform argument is irrelevant here - `loadMainAs` is
  // being used for the fresh instance, not for the platform.
  configStore.updateConfig({ uiLanguage: 'ru' });
  const { configStore: reloaded } = await loadMainAs('linux', 'store/config.store.js');
  check(
    'the migration leaves a stored chrome language alone on the next launch',
    reloaded.getConfig().uiLanguage === 'ru'
  );

  // And the other direction: absent on disk, it is written rather than only defaulted on read,
  // so the two processes agree about what the setting is before anything asks.
  const beforeBackfill = configStore.getStoredRuntime() ?? {};
  delete beforeBackfill.uiLanguage;
  configStore.setStoredRuntime(beforeBackfill);
  const { configStore: backfilled } = await loadMainAs('darwin', 'store/config.store.js');
  check(
    'and backfills English onto an install that predates the setting',
    backfilled.getStoredRuntime()?.uiLanguage === 'en'
  );

  configStore.updateConfig({ uiLanguage: 'en' });

  // Main has its own share of the chrome - the placeholder panel copy it seeds, and the push
  // notifications it raises as toasts from paths the renderer cannot see. `UiStrings` makes a
  // missing key a build error and `Record<UiLanguage, UiStrings>` makes a missing language one,
  // so what is left is the same thing the renderer locales' check covers: an entry that is still
  // its English original. Each language's block runs from its own key to the next one.
  const mainSource = readSource(new URL('../src/main/utils/ui-strings.ts', import.meta.url));
  const blockStarts = [...codeOnly(mainSource).matchAll(/\[UiLanguage\.(\w+)\]: \{/g)].map((m) => ({
    member: m[1],
    index: m.index,
  }));
  const mainBlock = (member) => {
    const source = codeOnly(mainSource);
    const at = blockStarts.findIndex((block) => block.member === member);
    const next = blockStarts[at + 1]?.index ?? source.indexOf('\nexport function uiStrings');
    return source.slice(blockStarts[at].index, next);
  };
  const mainEnLiterals = new Set(literalsOf(mainBlock('English')));
  for (const [member, code] of Object.entries(UiLanguage)) {
    if (code === 'en') continue;
    const hasBlock = blockStarts.some((b) => b.member === member);
    check(`the main-process table has a block for ${code}`, hasBlock);
    if (!hasBlock) continue;
    const literals = literalsOf(mainBlock(member));
    check(`the main-process ${code} block has strings to check`, literals.length > 10);
    const untranslated = literals.filter((literal) =>
      isUntranslated(code, literal, mainEnLiterals)
    );
    check(
      `every ${code} main-process string is translated${untranslated.length ? ` (left in English: ${untranslated.map((s) => JSON.stringify(s)).join(', ')})` : ''}`,
      untranslated.length === 0
    );
  }

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
