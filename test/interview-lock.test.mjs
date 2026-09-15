/**
 * The interview navigation lock is renderer code, so these are source-level checks in the same
 * shape as `audio-device-switch.test.mjs` - and for the same reason. What they pin is an
 * ordering between two React effects, which no type checker or linter can see and which reads
 * like an over-complication to whoever next tidies it up.
 *
 * The failure being guarded against: `useBlocker` hands its predicate to the router from a
 * `useEffect`, so the router holds whatever the *previous* committed render gave it. A route
 * that renders `<Navigate>` in the same commit as the state change that permits the navigation
 * is therefore asked the question with last render's answer, and refused - and `<Navigate>` has
 * a stable dep array, so it never asks again. Ending a mock interview with nothing recorded
 * resets the session to Idle and used to land on a blank screen for exactly this reason.
 *
 * Reading the answer off a ref written in a *layout* effect is what closes that window: layout
 * effects for the whole tree run during the commit, before any passive effect in it.
 */
import { codeOnly, createChecker, readSource } from './helpers.mjs';

/** The slice from the first `open` at or after `from` to its matching `close`, or ''. */
function balanced(source, from, open, close) {
  if (from < 0) return '';
  const start = source.indexOf(open, from);
  if (start === -1) return '';
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === open) depth++;
    else if (source[i] === close && --depth === 0) return source.slice(start, i + 1);
  }
  return '';
}

export async function run() {
  const { check, failures } = createChecker('interview-lock');

  const source = codeOnly(
    readSource(new URL('../src/renderer/hooks/use-interview-lock.ts', import.meta.url))
  );

  check('the lock still blocks through useBlocker', source.includes('useBlocker('));

  // Both slices are bounded rather than run to the end of the file. The closure check below
  // forbids naming `active` at all, and the ref is *written* from `{ active, exiting, signedOut }`
  // a few lines above - so an unbounded slice would fail the moment someone moved the layout
  // effect under the blocker call, with a message describing a defect that is not there.
  const blockerCall = balanced(source, source.indexOf('useBlocker('), '(', ')');
  // Falling back to the whole call rather than to nothing: an arrow with a concise body - which
  // is the shape the bug had - has no braces to bound, and an empty slice would pass every check
  // below by containing none of what they forbid.
  const predicate = balanced(blockerCall, blockerCall.indexOf('=>'), '{', '}') || blockerCall;

  check(
    'the predicate reads the current answer off a ref',
    predicate.includes('predicateRef.current')
  );

  // A reference to the bare variable rather than to the field on the ref is a reference to one
  // render's answer, which is the whole of the defect.
  check(
    'and does not close over the render values it is deciding on',
    !/[^.\w]active\b/.test(predicate) &&
      !/[^.\w]exiting\b/.test(predicate) &&
      !/[^.\w]signedOut\b/.test(predicate)
  );

  // Stability is not cosmetic here. A predicate whose identity changes every render is one the
  // router re-registers every render, from the same passive effect, which is the thing being
  // raced.
  check(
    'the predicate is stable across renders',
    /useBlocker\(\s*useCallback\b/.test(source) &&
      /,\s*\[\s*\]\s*\)$/.test(
        balanced(blockerCall, blockerCall.indexOf('useCallback'), '(', ')').trim()
      )
  );

  // The ordering itself. A plain `useEffect` here runs *after* a child's, which is precisely the
  // window the blank page appeared in.
  const refWrite = source.indexOf('predicateRef.current = ');
  const layout = source.lastIndexOf('useLayoutEffect(', refWrite);
  check('the ref is written from a layout effect', refWrite !== -1 && layout !== -1);

  // Prettier is not enforced in this repo, so this asks for the shape rather than the spacing:
  // an argument list that is only the effect body is one that runs on every render.
  const layoutCall = balanced(source, layout, '(', ')');
  check(
    'that layout effect runs on every render rather than on a dependency change',
    /^\(\s*\(\s*\)\s*=>/.test(layoutCall) &&
      /predicateRef\.current\s*=\s*\{\s*active,\s*exiting,\s*signedOut\s*\}/.test(layoutCall) &&
      !/,\s*\[/.test(layoutCall.slice(layoutCall.lastIndexOf('}')))
  );

  // The redirect this exists to let through: ending a mock interview with nothing recorded
  // resets the session to Idle in main, and this is the only thing that takes the candidate off
  // a route that then has nothing left to show.
  const page = codeOnly(
    readSource(new URL('../src/renderer/pages/mock-interview/index.tsx', import.meta.url))
  );
  check(
    'an Idle mock session with nothing pending redirects home',
    /<Navigate to="\/" replace \/>/.test(page)
  );

  return failures;
}
