import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useAppState } from '@/hooks/use-app-state';
import { useT } from '@/i18n';
import { minutesCovered } from '@/lib/credit-gate';

/** Minutes left at which each warning fires, largest first. */
export const LOW_BALANCE_WARNING_MINUTES = [5, 1] as const;

/**
 * Warn, once each, when a running session's balance falls to five minutes and to one.
 *
 * The backend ends the session at zero credits, live or mock, and an interview cut off without
 * notice is the worst way to find that out. The title bar already turns the remaining time yellow
 * under five minutes, but nobody is looking at the title bar mid-answer; a toast is the one thing
 * on screen that interrupts.
 *
 * Read off the balance the ping refreshes every few seconds, so a warning can lag the real
 * balance by that much - harmless, since the stop itself is enforced by the backend. A session
 * that starts already below a threshold gets that warning at once, and only the lowest one it is
 * under: starting with half a minute left says "one minute", not "five" and then "one".
 *
 * `active` is whether a session is running now; the warnings re-arm each time it turns true.
 */
export function useLowBalanceWarning(active: boolean) {
  const t = useT();
  const { appState } = useAppState();
  const credits = appState?.credits;
  const creditsPerMinute = appState?.creditsPerMinute;

  // The thresholds already warned about in this session.
  const warned = useRef(new Set<number>());

  useEffect(() => {
    if (!active) {
      warned.current.clear();
      return;
    }
    if (credits === undefined) return;

    const minutes = minutesCovered(credits, creditsPerMinute);
    const crossed = LOW_BALANCE_WARNING_MINUTES.filter((threshold) => minutes < threshold + 1);
    if (crossed.length === 0) return;

    // The lowest threshold crossed is the one worth saying; the ones above it are marked too, so
    // they do not fire later out of order.
    const lowest = crossed[crossed.length - 1];
    if (warned.current.has(lowest)) return;
    crossed.forEach((threshold) => warned.current.add(threshold));

    toast.warning(t.creditGate.lowBalance(Math.max(minutes, 1)), {
      description: t.creditGate.lowBalanceHint,
    });
  }, [active, credits, creditsPerMinute, t]);
}
