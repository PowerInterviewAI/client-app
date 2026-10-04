/**
 * Run the locales, rather than only type-checking them.
 *
 * `Translation = typeof en` makes a missing or misspelled key a build error, and that is most of
 * what can go wrong. It cannot see two things, because both type-check perfectly:
 *
 * - a leaf that is `undefined` at runtime, which renders as nothing and leaves a blank label;
 * - a parameterised string that **throws** when called, which takes the whole screen down rather
 *   than showing the wrong words. `plural`, three `toLocaleString` calls and the two `duration`
 *   functions all run real logic, and until this file existed none of it had ever executed.
 *
 * The locale files are renderer code and the renderer has no runtime harness in this directory,
 * so they are transpiled here with `ts.transpileModule` - one call, no bundler. Both files are
 * self-contained once the types are stripped: `en.ts` imports nothing, and `ru.ts`'s only import
 * is `import type`, which is elided.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import ts from 'typescript';

import { createChecker } from './helpers.mjs';

const LOCALES = path.resolve(
  fileURLToPath(new URL('../src/renderer/i18n/locales', import.meta.url))
);

/** Every leaf, as `dotted.path` -> value. */
function flatten(node, prefix = '') {
  const out = new Map();
  for (const [key, value] of Object.entries(node)) {
    const at = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && typeof value !== 'function') {
      for (const [k, v] of flatten(value, at)) out.set(k, v);
    } else {
      out.set(at, value);
    }
  }
  return out;
}

async function load(locale, outDir) {
  const source = fs.readFileSync(path.join(LOCALES, `${locale}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: `${locale}.ts`,
  });
  const out = path.join(outDir, `${locale}.locale.mjs`);
  fs.writeFileSync(out, outputText, 'utf8');
  const mod = await import(pathToFileURL(out).href);
  return mod[locale];
}

export async function run(userDataDir) {
  const { check, failures } = createChecker('locale-runtime');

  const outDir = fs.mkdtempSync(path.join(userDataDir, 'locales-'));
  const dictionaries = {
    en: await load('en', outDir),
    ru: await load('ru', outDir),
  };

  check('both locales load', Boolean(dictionaries.en) && Boolean(dictionaries.ru));

  const flat = {
    en: flatten(dictionaries.en),
    ru: flatten(dictionaries.ru),
  };

  check('the locale has a realistic number of leaves', flat.en.size > 400);

  // The compiler's parity check, repeated at runtime - which is not redundant: `typeof en`
  // describes the *shape*, so a leaf written as `undefined` satisfies it and still renders as
  // nothing on screen.
  const missing = [...flat.en.keys()].filter((key) => !flat.ru.has(key));
  const extra = [...flat.ru.keys()].filter((key) => !flat.en.has(key));
  check(
    `no key is missing from ru${missing.length ? ` (${missing.join(', ')})` : ''}`,
    missing.length === 0
  );
  check(`no key is only in ru${extra.length ? ` (${extra.join(', ')})` : ''}`, extra.length === 0);

  for (const [locale, leaves] of Object.entries(flat)) {
    const empty = [];
    const broken = [];

    for (const [key, value] of leaves) {
      if (typeof value === 'string') {
        if (value.length === 0) empty.push(key);
        continue;
      }
      if (typeof value !== 'function') {
        broken.push(`${key} is ${typeof value}`);
        continue;
      }

      // Every parameter gets a number: they interpolate, they survive `toLocaleString`, and they
      // are what `plural` and the two `duration` builders actually take. Called twice, with 1 and
      // with 0, because the `duration` functions branch on each part being truthy - `0` is the
      // path that returns the "no time left" fallback, and it is the one a drained balance hits.
      for (const filler of [1, 0]) {
        const args = Array.from({ length: value.length }, () => filler);
        let result;
        try {
          result = value(...args);
        } catch (error) {
          broken.push(`${key}(${args.join(', ')}) threw: ${error.message}`);
          continue;
        }
        if (typeof result !== 'string' || result.length === 0) {
          broken.push(`${key}(${args.join(', ')}) returned ${JSON.stringify(result)}`);
        } else if (/undefined|NaN/.test(result)) {
          broken.push(`${key}(${args.join(', ')}) produced ${JSON.stringify(result)}`);
        }
      }
    }

    check(
      `${locale}: no leaf is an empty string${empty.length ? ` (${empty.join(', ')})` : ''}`,
      empty.length === 0
    );
    check(
      `${locale}: every leaf resolves to text${broken.length ? ` (${broken.join('; ')})` : ''}`,
      broken.length === 0
    );
  }

  // Russian's plural selector, exercised directly on the numbers that distinguish the three
  // forms. 1 and 21 take the first, 2 and 22 the second, 5 and 11 the third - and 11 is the one
  // a naive `n % 10 === 1` rule gets wrong, which is the whole reason the helper exists.
  const { plural } = await import(pathToFileURL(path.join(outDir, 'ru.locale.mjs')).href);
  const forms = [
    [1, 'one'],
    [21, 'one'],
    [2, 'few'],
    [4, 'few'],
    [22, 'few'],
    [5, 'many'],
    [11, 'many'],
    [12, 'many'],
    [14, 'many'],
    [25, 'many'],
    [0, 'many'],
  ];
  for (const [n, expected] of forms) {
    check(`plural(${n}) is the ${expected} form`, plural(n, 'one', 'few', 'many') === expected);
  }

  fs.rmSync(outDir, { recursive: true, force: true });

  return failures;
}
