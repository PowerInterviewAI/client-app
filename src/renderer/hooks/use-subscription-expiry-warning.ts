import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAppState } from '@/hooks/use-app-state';
import { useNow } from '@/hooks/use-now';
import { useT } from '@/i18n';
import { daysLeft, EXPIRY_WARNING_DAYS } from '@/lib/subscription';

/**
 * Toast when a subscription is about to end, and when it has.
 *
 * Passes are prepaid and never renew, so nothing else will tell the user their time is running
 * out: the title bar turns "Ends in N days" yellow, but nobody reads the title bar until something
 * stops working. That something is an interview cut off at zero free time.
 *
 * - **Ending soon**: once per day count, at 3, 2 and 1 days left, keyed by the expiry so buying
 *   another pass (which moves it) re-arms rather than repeats. Shown again on the next launch,
 *   since a reminder that only ever fires once is easy to dismiss and forget.
 * - **Ended**: once, when this session saw the subscription go from active to lapsed. Never on
 *   launch for an expiry long past, and never across a sign-out: `CLEARED_BALANCE` sets
 *   `subscribed` to undefined between accounts, which resets what was seen rather than reading
 *   as a lapse.
 *
 * Mounted in `MainFrame`, the one component every route renders, so neither depends on the screen
 * the user happens to be on. `useNow` is what crosses a day boundary without a ping changing
 * anything.
 */
export function useSubscriptionExpiryWarning() {
  const t = useT();
  const navigate = useNavigate();
  const { appState } = useAppState();
  const subscribed = appState?.subscribed;
  const expiresAt = appState?.subscriptionExpiresAt ?? null;
  const now = useNow();

  const warned = useRef(new Set<string>());
  const wasSubscribed = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (subscribed !== true || expiresAt === null) return;
    const days = daysLeft(expiresAt, now);
    if (days <= 0 || days > EXPIRY_WARNING_DAYS) return;

    const key = `${expiresAt}:${days}`;
    if (warned.current.has(key)) return;
    warned.current.add(key);

    toast.warning(t.subscriptionExpiry.endingSoon(days), {
      description: t.subscriptionExpiry.endingSoonHint,
      action: { label: t.creditGate.subscribe, onClick: () => navigate('/payment') },
    });
  }, [subscribed, expiresAt, now, t, navigate]);

  useEffect(() => {
    const previous = wasSubscribed.current;
    wasSubscribed.current = subscribed;
    if (previous !== true || subscribed !== false) return;

    toast.warning(t.subscriptionExpiry.ended, {
      description: t.subscriptionExpiry.endedHint,
      action: { label: t.creditGate.subscribe, onClick: () => navigate('/payment') },
    });
  }, [subscribed, t, navigate]);
}
