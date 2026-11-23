/**
 * The subscription expiry toasts are renderer code, so these are source-level checks in the same
 * shape as `interview-lock.test.mjs`. What they pin are the conditions that keep a toast honest,
 * each of which a tidy-up could loosen with no symptom a type checker or a linter can see:
 *
 * - "Ended" fires only on a transition this session saw, active to lapsed. Reading `!subscribed`
 *   alone would announce a lapse to every free user on launch, and to everyone on sign-out, since
 *   `CLEARED_BALANCE` writes `undefined` between accounts.
 * - "Ending soon" is keyed by the expiry *and* the day count. Keyed by the day count alone, a
 *   second pass bought inside the window would never warn about its own end; keyed by the expiry
 *   alone, the 2-day and 1-day reminders would never fire.
 * - The hook is mounted in `MainFrame`, the one component every route renders. Mounted on a page,
 *   a subscription lapsing while the user is elsewhere goes unannounced.
 */
import { codeOnly, createChecker, readSource } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('subscription-expiry-warning');

  const hook = codeOnly(
    readSource(new URL('../src/renderer/hooks/use-subscription-expiry-warning.ts', import.meta.url))
  );
  const frame = codeOnly(
    readSource(new URL('../src/renderer/components/custom/main-frame.tsx', import.meta.url))
  );

  check('MainFrame mounts the expiry warning', frame.includes('useSubscriptionExpiryWarning()'));

  check(
    '"ended" needs the previous value to have been true and the new one false',
    /previous\s*!==\s*true\s*\|\|\s*subscribed\s*!==\s*false/.test(hook)
  );
  check(
    'the previous value is recorded before that test',
    hook.includes('wasSubscribed.current = subscribed')
  );

  check('"ending soon" only warns an active subscription', hook.includes('subscribed !== true'));
  check('and is keyed by the expiry and the day count', /`\$\{expiresAt\}:\$\{days\}`/.test(hook));
  check(
    'within the warning window and not after the end',
    hook.includes('days <= 0') && hook.includes('days > EXPIRY_WARNING_DAYS')
  );

  return failures;
}
