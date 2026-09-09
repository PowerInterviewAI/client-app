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

  const secondDiv = session.match(/<div className="flex-1[^"]*overflow-hidden gap-1">/)?.[0] ?? '';
  check('the panel-and-status column does too', secondDiv.includes('min-h-0'));

  // And the two wrappers inside it, which are the last link in that chain: they set no
  // `overflow` either, so their floor is their content's min-content height - and the panel they
  // hold is `h-full`, which reads as `auto` while that floor is being computed, making the floor
  // the whole transcript. Past the point where the transcript is longer than the row, each
  // wrapper was taller than the row that holds it and the panel overflowed the column above.
  const wrappers = session.match(/<div className="flex-1 min-w-0[^"]*">/g) ?? [];
  check(
    'both panel wrappers clamp their height too',
    wrappers.length === 2 && wrappers.every((w) => w.includes('min-h-0'))
  );

  // Hidden is not the same as not scrollable: Chromium scrolls an `overflow: hidden` box
  // programmatically, and `scrollIntoView` brings its target into view inside *every* scrollable
  // ancestor rather than only the nearest one. With the column above having anything to scroll,
  // the transcript's own auto-scroll dragged it - and the status line and control bar under it -
  // on every question while the interviewer was speaking. Scrolling the panel's own scroller
  // reaches nothing outside the panel.
  const panel = codeOnly(
    readSource(
      new URL('../src/renderer/components/custom/panels/mock-transcript-panel.tsx', import.meta.url)
    )
  );
  check(
    'the mock transcript scrolls its own container rather than reaching up through ancestors',
    !panel.includes('scrollIntoView') && /scrollerRef\.current/.test(panel)
  );

  // One axis hidden and the other left `visible` is not expressible: the visible axis computes to
  // `auto`. Both of these are meant to clip rather than scroll sideways, and a horizontal
  // scrollbar in either is ten pixels of height taken out of the bottom of the screen.
  check('the panel-and-status column clips both axes', !/overflow-y-hidden/.test(session));
  check(
    'the transcript scroller pins its horizontal axis',
    panel.includes('overflow-y-auto overflow-x-hidden')
  );

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
