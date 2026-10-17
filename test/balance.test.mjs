/**
 * How a balance answer from the backend becomes AppState.
 *
 * A backend with subscriptions sends `credits` for clients that predate them: for a subscriber it
 * is the time left on the subscription expressed in credits, so an old client does not lock a
 * paying user out. This client reads `free_credits` instead whenever it is there. Getting that the
 * wrong way round fails quietly in both directions: a subscriber shown hundreds of thousands of
 * credits, or a free user's free hour hidden behind a number they cannot spend.
 */
import { createChecker, loadMain } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('balance');
  const { balanceState } = await loadMain('utils/balance.js');

  const subscriber = balanceState({
    credits: 432000,
    free_credits: 0,
    subscribed: true,
    subscription_expires_at: 1_800_000_000_000,
    subscription_plan: 'yearly',
  });
  check('a subscriber shows the free balance, not the legacy figure', subscriber.credits === 0);
  check('and is subscribed', subscriber.subscribed === true);
  check('with the end date', subscriber.subscriptionExpiresAt === 1_800_000_000_000);
  check('and the plan', subscriber.subscriptionPlan === 'yearly');

  const free = balanceState({ credits: 540, free_credits: 540, subscribed: false });
  check('a free user shows the free hour left', free.credits === 540);
  check('and is not subscribed', free.subscribed === false);
  check('with no end date', free.subscriptionExpiresAt === null);

  // A backend deployed before subscriptions sends only `credits`, which is then the real balance.
  const legacy = balanceState({ credits: 1200 });
  check('an older backend keeps its credits', legacy.credits === 1200);
  check('and reads as not subscribed rather than unknown', legacy.subscribed === false);
  check('with no plan', legacy.subscriptionPlan === null);

  // Subscribed with no end date is not a state the display can show, so it is not subscribed: the
  // start gate and the title bar must agree about whether the account is unlimited.
  const noEnd = balanceState({
    credits: 0,
    free_credits: 0,
    subscribed: true,
    subscription_expires_at: null,
  });
  check('subscribed without an end date reads as not subscribed', noEnd.subscribed === false);

  return failures;
}
