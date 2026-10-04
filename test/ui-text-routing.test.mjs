/**
 * No English prose left as a JSX child in the renderer.
 *
 * Every string a user reads goes through `t.` now, and the compiler guarantees that whatever is
 * reached that way exists in both locales. What it cannot see is a string that was never routed
 * through `t` at all - it is an ordinary JSX child, it type-checks, it renders, and it renders in
 * English in a Russian app.
 *
 * `trial-user-notice.tsx` is why this file exists. It survived six translation passes and a
 * literal-scanning sweep, because its sentence was split across lines by two `<span>`s and a
 * `<br />`, so no single line held anything that looked like a string. It is on screen for every
 * trial user on `/main`.
 *
 * The match is text sitting *between two tags*, which is the one shape that cannot be code: a
 * `>` ... `<` pair in a .tsx file is a JSX child or nothing. Candidates carrying bracket or
 * operator characters are dropped, since those are a ternary or an expression caught mid-flight
 * rather than prose.
 *
 * If a genuinely untranslatable child ever appears - a two-word brand name - add it to
 * `NOT_PROSE` with the reason, the way `ui-language.test.mjs` handles its Latin strings.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createChecker, readSource } from './helpers.mjs';

const RENDERER = path.resolve(fileURLToPath(new URL('../src/renderer', import.meta.url)));

/** shadcn primitives, which carry no copy of their own. */
const SKIP_DIRS = new Set(['ui']);

const NOT_PROSE = new Set();

/**
 * Attributes that carry copy, and so must be an expression rather than a string literal.
 *
 * `proceedLabel="Continue"` is why this list exists: one word, inside an attribute, on the
 * permission gate `/main` opens during startup - so the dialog showed a translated title, rows
 * and Cancel beside an English primary button. The between-tags match below cannot see inside a
 * tag at all, and a one-word literal is too short for the prose heuristic even if it could.
 *
 * The rule is the shape, not the content: anything here written as `foo="bar"` is untranslated
 * by construction, whatever the words are. `alt=""` is allowed, because an empty alt is how a
 * decorative image is excluded from the accessibility tree.
 */
const COPY_ATTRIBUTES = [
  'aria-label',
  'placeholder',
  'title',
  'label',
  'description',
  'disclaimer',
  'proceedLabel',
  'alt',
  'heading',
];

// `\\b` rather than `\b`: inside a template literal the latter is a backspace character, which
// matches nothing and makes the whole check pass vacuously.
const COPY_ATTRIBUTE = new RegExp(`\\b(${COPY_ATTRIBUTES.join('|')})="([^"]+)"`, 'g');

/**
 * Text between two tags, kept to letters, spaces and sentence punctuation.
 *
 * Brackets, braces and operators are excluded, which is what keeps a ternary caught mid-flight
 * (`url ? (`) from reading as a sentence. `?` is allowed, because a heading that is a question
 * is ordinary copy.
 */
const JSX_TEXT = />\s*([A-Za-z][A-Za-z ’',.:;!?-]{5,}?)\s*</gs;

function tsxFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) out.push(...tsxFiles(path.join(dir, entry.name)));
    } else if (entry.name.endsWith('.tsx')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

export async function run() {
  const { check, failures } = createChecker('ui-text-routing');

  const files = tsxFiles(RENDERER);
  check('there are renderer components to scan', files.length > 30);

  const found = [];

  for (const file of files) {
    let source = readSource(file);
    source = source
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');

    for (const match of source.matchAll(JSX_TEXT)) {
      const text = match[1].replace(/\s+/g, ' ').trim();
      // One word is a label the scan cannot tell from an identifier; two is a sentence.
      if (!text.includes(' ') || NOT_PROSE.has(text)) continue;
      found.push(`${path.relative(RENDERER, file).replace(/\\/g, '/')}: "${text}"`);
    }
  }

  check(
    `no English prose is left as a JSX child${found.length ? ` (${found.join('; ')})` : ''}`,
    found.length === 0
  );

  const literalAttributes = [];
  for (const file of files) {
    const source = readSource(file)
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ');
    for (const match of source.matchAll(COPY_ATTRIBUTE)) {
      literalAttributes.push(
        `${path.relative(RENDERER, file).replace(/\\/g, '/')}: ${match[1]}="${match[2]}"`
      );
    }
  }

  check(
    `every copy-bearing attribute is an expression${literalAttributes.length ? ` (${literalAttributes.join('; ')})` : ''}`,
    literalAttributes.length === 0
  );

  return failures;
}
