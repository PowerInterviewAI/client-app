/**
 * Two mock-interview defects, source-level like `rtl-rendering.test.mjs` and
 * `mock-transcript-turns.test.mjs` - this is renderer code with no runtime harness here, and
 * neither of these fails a type check or a lint.
 */
import { codeOnly, createChecker, readSource } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('mock-session-scroll');

  const session = codeOnly(
    readSource(new URL('../src/renderer/pages/mock-interview/session.tsx', import.meta.url))
  );

  // A flex item's default min-height is its content's, and only an element whose own `overflow`
  // is something other than `visible` gets that floor automatically reset to zero. Two divs on
  // this route set neither `overflow` nor `min-h-0`, so the transcript and live-hint panels' own
  // `overflow-y-auto` had nothing to overflow against - their ancestor had already grown to fit
  // them. The excess was absorbed by MainFrame's outer container instead
  // (`overflow-auto hide-scrollbar`), so the whole page scrolled with no visible scrollbar and
  // neither panel ever got one of its own.
  const outerDiv = session.match(/<div className="flex-1[^"]*w-full bg-background p-1 space-y-1">/)?.[0] ?? '';
  check('the route root clamps its height rather than growing to fit its content', outerDiv.includes('min-h-0'));

  const secondDiv = session.match(/<div className="flex-1[^"]*overflow-y-hidden gap-1">/)?.[0] ?? '';
  check('the panel-and-status column does too', secondDiv.includes('min-h-0'));

  // The Idle fallback on mock-interview/index.tsx redirects now that setup lives on the home
  // screen - where the old full-page setup screen used to render harmlessly for one frame, a
  // `<Navigate>` there actually fires. React mounts a child's own effect before the parent's
  // later ones, so a first render that reached that branch - true on every fresh navigation,
  // since `session` has not caught up to the broadcast yet - would send the candidate straight
  // back out before the effect that starts the session ever ran. `autoStarting`'s initial state
  // has to already be true on that render, not merely set true by an effect later - a run-order
  // property no build step catches.
  const index = codeOnly(
    readSource(new URL('../src/renderer/pages/mock-interview/index.tsx', import.meta.url))
  );

  check(
    'autoStarting is seeded from pendingSetup on the first render, not only set by an effect',
    /useState\(\(\) => Boolean\(pendingSetup\)\)/.test(index)
  );
  check(
    'the Idle fallback still redirects when nothing is pending',
    index.includes('<Navigate to="/"')
  );

  return failures;
}
