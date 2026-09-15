/**
 * Signing out has to land on a sign-in screen from wherever it was done.
 *
 * Renderer code, so these are source-level checks in the same shape as `interview-lock.test.mjs`
 * and for the same reason: what they pin is which component owns a redirect, which no type
 * checker sees and which reads like a tidy-up to whoever next moves it back.
 *
 * The failure being guarded against: the redirect lived on `/` alone, and `/` is the one route
 * that cannot be signed out of without being on it. Sign-out is reachable from every route -
 * the titlebar menu and the command palette are both mounted in `MainFrame` - so signing out
 * from Configuration left the user on Configuration, signed out, with no way to a sign-in screen
 * but the menu they had just used. An expiring token flips the same flag from main, on whatever
 * route the user is on, and did the same thing.
 *
 * Three properties, each of which looks like working code on its own:
 * - the shell redirects, so every route is covered rather than one;
 * - `/` no longer carries a second copy, because two owners are how one of them came to be the
 *   only one;
 * - `/auth` is exempt, or the redirect fights the sign-in screen it is trying to reach.
 */
import { codeOnly, createChecker, readSource } from './helpers.mjs';

const MAIN_FRAME = new URL('../src/renderer/components/custom/main-frame.tsx', import.meta.url);
const INDEX_PAGE = new URL('../src/renderer/pages/index.tsx', import.meta.url);

export async function run() {
  const { check, failures } = createChecker('signed-out-redirect');

  const shell = codeOnly(readSource(MAIN_FRAME));
  const index = codeOnly(readSource(INDEX_PAGE));

  // --- the shell redirects ------------------------------------------------------------------
  check('the shell navigates to the sign-in route', shell.includes("navigate('/auth/login'"));
  check(
    'it is guarded on a definite signed-out flag, not a falsy one',
    shell.includes('isLoggedIn === false') && !/isLoggedIn\s*\)\s*\{/.test(shell)
  );
  check(
    'it replaces rather than pushes, so Back cannot return to a signed-out page',
    /navigate\('\/auth\/login',\s*\{\s*replace:\s*true\s*\}\)/.test(shell)
  );
  check('the shell reads the current route', shell.includes('useLocation'));

  // --- /auth is exempt ----------------------------------------------------------------------
  check(
    'the auth routes are exempt, so the redirect cannot fight the sign-in screen',
    /pathname\.startsWith\('\/auth\//.test(shell)
  );
  check(
    'the exemption covers signup and forgot-password too, not just /auth/login',
    !/pathname\s*===\s*'\/auth\/login'\s*\)/.test(shell)
  );

  // --- one owner ----------------------------------------------------------------------------
  check(
    'the index route no longer carries its own copy of the redirect',
    !index.includes("navigate('/auth/login'")
  );
  check(
    'the index route still gates first-run setup, which is its own job',
    index.includes("navigate('/onboarding'")
  );

  return failures;
}
