import type { Translation } from '@/i18n';
import { minutesCovered } from '@/lib/credit-gate';

/** What the UI needs to know about an account's subscription, read off the ping. */
export interface SubscriptionSummary {
  subscribed: boolean;
  /** Unix ms; null for an account that never had one. */
  expiresAt: number | null;
  /** `monthly` / `yearly`, or null when unknown. */
  plan: string | null;
}

export function subscriptionOf(
  state:
    | {
        subscribed?: boolean;
        subscriptionExpiresAt?: number | null;
        subscriptionPlan?: string | null;
      }
    | null
    | undefined
): SubscriptionSummary {
  return {
    subscribed: state?.subscribed === true,
    expiresAt: state?.subscriptionExpiresAt ?? null,
    plan: state?.subscriptionPlan ?? null,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days left, rounded up, so the last day reads "1 day" rather than "0 days". */
export function daysLeft(expiresAt: number, now: number): number {
  return Math.max(0, Math.ceil((expiresAt - now) / DAY_MS));
}

/** Days left at or below which the end date is shown as a warning. */
export const EXPIRY_WARNING_DAYS = 3;

/** Which locale name an active plan is shown as; `other` when the backend did not say. */
export function planKey(plan: string | null): 'monthly' | 'yearly' | 'other' {
  return plan === 'monthly' || plan === 'yearly' ? plan : 'other';
}

/**
 * The free hour left, as the title bar and the home plan line both say it. Split into hours and
 * minutes and assembled in the locale, because which plural form each number takes is a property
 * of the language. Under a minute but above zero is its own case: "no free time left" would be
 * untrue, and is what a refused start used to tell a user the title bar said had time left.
 */
export function freeTimeLabel(
  t: Translation,
  credits: number,
  creditsPerMinute: number | undefined
): string {
  const minutes = minutesCovered(credits, creditsPerMinute);
  if (minutes > 0) {
    return t.creditsDisplay.freeLeft(
      t.creditsDisplay.duration(Math.floor(minutes / 60), minutes % 60)
    );
  }
  return credits > 0
    ? t.creditsDisplay.freeLeft(t.creditsDisplay.lessThanAMinute)
    : t.creditsDisplay.noFreeTimeLeft;
}
