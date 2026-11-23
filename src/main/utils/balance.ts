import type { AppState } from '../types/app-state.js';

/** The balance fields the ping and `GET /api/payment/credits` both answer with. */
export interface BackendBalance {
  credits?: number;
  free_credits?: number;
  subscribed?: boolean;
  subscription_expires_at?: number | null;
  subscription_plan?: string | null;
}

/**
 * The AppState slice a balance answer sets.
 *
 * `credits` in AppState is always the free-tier balance. A backend with subscriptions sends it as
 * `free_credits`, and keeps `credits` for clients that predate subscriptions - where, for a
 * subscriber, it is the time left on the subscription expressed in credits so those clients do not
 * lock a paying user out. Reading that legacy value here would show a subscriber a balance they
 * cannot spend, so `free_credits` wins whenever it is present. An older backend sends only
 * `credits`, which is then the real (and only) balance, and nothing about a subscription.
 */
export function balanceState(data: BackendBalance): Partial<AppState> {
  const expiresAt = data.subscription_expires_at ?? null;
  return {
    credits: data.free_credits ?? data.credits,
    // Subscribed only with an end date to show: the display and the start gate both need one, and
    // they must not disagree about whether this account is unlimited.
    subscribed: data.subscribed === true && expiresAt !== null,
    subscriptionExpiresAt: expiresAt,
    subscriptionPlan: data.subscription_plan ?? null,
  };
}

/**
 * The AppState slice with no account's balance in it: "not answered yet", as at launch. Written on
 * sign-in and sign-out so one account's free time and subscription never show for the next one on
 * a shared machine while the first ping is still on its way.
 */
export const CLEARED_BALANCE: Partial<AppState> = {
  credits: undefined,
  subscribed: undefined,
  subscriptionExpiresAt: undefined,
  subscriptionPlan: undefined,
};
