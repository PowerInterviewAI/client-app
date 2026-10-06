/**
 * The one rule for whether a session may start, run rather than read.
 *
 * Live and mock are both billed by the minute and closed by the backend at zero, so starting asks
 * for a minute's worth. The backend cannot enforce that itself - it cannot tell a new session from
 * a reconnect inside one - so this rule is the only thing standing between a candidate and a
 * session that is cut off seconds after it starts, and its two edges both fail quietly: a minimum
 * off by one refuses a balance that could start, and an unknown balance read as zero greys both
 * launch cards out for the first seconds of every launch.
 *
 * `credit-gate.ts` is renderer code, so it is transpiled here the way `locale-runtime.test.mjs`
 * transpiles the locales. Its one import is the compiled-in rate, stubbed beside it, because the
 * real `consts.ts` reads `navigator` at load.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import ts from 'typescript';

import { createChecker } from './helpers.mjs';

const SOURCE = fileURLToPath(new URL('../src/renderer/lib/credit-gate.ts', import.meta.url));

export async function run(userDataDir) {
  const { check, failures } = createChecker('credit-gate');

  const outDir = fs.mkdtempSync(path.join(userDataDir, 'credit-gate-'));
  try {
    const { outputText } = ts.transpileModule(fs.readFileSync(SOURCE, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      fileName: 'credit-gate.ts',
    });
    fs.writeFileSync(path.join(outDir, 'consts.mjs'), 'export const CREDITS_PER_MINUTE = 10;\n');
    const out = path.join(outDir, 'credit-gate.mjs');
    fs.writeFileSync(out, outputText.replace("from './consts'", "from './consts.mjs'"), 'utf8');
    const gate = await import(pathToFileURL(out).href);

    check('a minute of credit may start', gate.canStartSession(10, 10));
    check('a credit short of a minute may not', !gate.canStartSession(9, 10));
    check('zero may not', !gate.canStartSession(0, 10));
    check('the minimum follows the served rate', !gate.canStartSession(10, 12));
    check(
      'and falls back to the compiled-in rate before the ping',
      !gate.canStartSession(9, undefined)
    );
    check(
      'an unknown balance is let through, so the cards are not greyed out at launch',
      gate.canStartSession(undefined, 10)
    );

    check('minutes covered rounds down', gate.minutesCovered(25, 10) === 2);
    check('and is never negative', gate.minutesCovered(-5, 10) === 0);
    check('the minimum is one minute of the served rate', gate.minimumStartCredits(12) === 12);
    check(
      'a five-question mock is estimated at about 13 minutes',
      gate.mockSessionMinutes(5) === 13
    );
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }

  return failures;
}
