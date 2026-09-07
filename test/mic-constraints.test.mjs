/**
 * Every microphone capture in the app must open through `micConstraints`.
 *
 * The three processing flags - `echoCancellation`, `noiseSuppression`, `autoGainControl` - are
 * stated rather than left to Chromium's defaults, so that they stop moving on their own under a
 * version bump and so that the echo work has one place to flip them from once the probe says
 * which way they should go. That only holds while every caller actually uses it.
 *
 * This is pinned rather than trusted because it has already been broken once, in the ordinary
 * way: while the echo branch was open, `main` grew two more captures. `mock-transcription.service`
 * inlined its own copy of the three flags, and the settings microphone test opened with
 * `audio: true`, which drops them entirely. Both merged clean - there is no conflict, no type
 * error and no lint warning in adding a second spelling of a constraint object, which is exactly
 * why a checker has to be the thing that notices.
 *
 * The `audio: true` case is the one with a user-visible edge: it is the mic *test* meter, so the
 * level shown while choosing a device would be measured through different processing than the
 * session that level is meant to predict.
 *
 * Only `src/` is scanned. `test/manual/echo-probe.mjs` opens its own capture with the flags
 * varied on purpose - driving that A/B is the probe's whole job - so it must not be caught here.
 *
 * Source-level, for the same reason `audio-device-switch.test.mjs` is: renderer code, and the
 * renderer has no runtime harness in this directory.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { codeOnly, createChecker, methodBody, readSource } from './helpers.mjs';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const SERVICE = new URL('../src/renderer/services/live-transcription.service.ts', import.meta.url);

/** Every .ts/.tsx file under `dir`, recursively. */
function sourceFiles(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry.name)) found.push(full);
  }
  return found;
}

export async function run() {
  const { check, failures } = createChecker('mic-constraints');

  // Enough of the call to cover the options object's `audio` key without running into whatever
  // follows the call itself.
  const CALL_WINDOW = 200;

  const callSites = [];
  for (const file of sourceFiles(SRC)) {
    const code = codeOnly(readSource(pathToFileURL(file)));
    for (const match of code.matchAll(/getUserMedia\(/g)) {
      callSites.push({
        file: path.relative(SRC, file).replace(/\\/g, '/'),
        text: code.slice(match.index, match.index + CALL_WINDOW),
      });
    }
  }

  // Without this the rest of the file passes vacuously the day someone renames the call or moves
  // capture behind a wrapper - a green check meaning "found nothing to look at".
  check('there are microphone captures to check', callSites.length > 0);

  const inlined = callSites.filter((site) => !site.text.includes('audio: micConstraints('));
  check(
    `every capture opens through micConstraints${inlined.length ? ` (not: ${inlined.map((s) => s.file).join(', ')})` : ''}`,
    inlined.length === 0
  );

  // Called out separately from the check above because it is the specific regression that reached
  // main, and because `true` fails differently: it does not merely duplicate the flags, it drops
  // them and hands that capture back to whatever Chromium currently defaults to.
  const bareTrue = callSites.filter((site) => /audio:\s*true/.test(site.text));
  check(
    `no capture falls back to \`audio: true\`${bareTrue.length ? ` (not: ${bareTrue.map((s) => s.file).join(', ')})` : ''}`,
    bareTrue.length === 0
  );

  const service = codeOnly(readSource(SERVICE));

  check(
    'micConstraints is exported for the other capture sites to use',
    /export function micConstraints\(/.test(service)
  );
  check('it is defined once', (service.match(/function micConstraints\(/g) || []).length === 1);

  // Scoped to the function's own braces. The inline worklet source further down this file ends
  // its `process()` with `return true`, so a check that searched the rest of the file would fail
  // on a perfectly correct implementation.
  const constraints = methodBody(service, 'export function micConstraints(');
  check('micConstraints has a body to read', constraints.length > 0);

  // The point of the helper is that the flags are written down, not that a helper exists.
  for (const flag of ['echoCancellation', 'noiseSuppression', 'autoGainControl']) {
    check(`micConstraints states ${flag}`, constraints.includes(`${flag}:`));
  }

  // The no-device case has to stay an object. Returning `true` for it would put every user on the
  // system default microphone back on Chromium's defaults, silently, and only for them.
  check(
    'the default-device case keeps the flags rather than returning `true`',
    !/return true/.test(constraints)
  );

  return failures;
}
