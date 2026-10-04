/**
 * Payment utility functions
 */

import type { Translation } from '@/i18n';
import { PaymentStatus } from '@/types/payment';

export function getStatusBadgeColor(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.Finished:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    case PaymentStatus.Failed:
    case PaymentStatus.Expired:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    case PaymentStatus.Waiting:
    case PaymentStatus.Confirming:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

/**
 * Takes the dictionary rather than calling `useT`, because this is reached from a table cell's
 * render as well as from a memoised card - a plain function either way, not a component.
 *
 * The fallback is the raw status string, which is what a backend ahead of this build sends: an
 * untranslated code on screen is poor, and a blank badge where the status should be is worse.
 */
export function getStatusLabel(t: Translation, status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.Waiting:
      return t.payment.statusLabels.waiting;
    case PaymentStatus.Confirming:
      return t.payment.statusLabels.confirming;
    case PaymentStatus.Confirmed:
      return t.payment.statusLabels.confirmed;
    case PaymentStatus.Sending:
      return t.payment.statusLabels.sending;
    case PaymentStatus.PartiallyPaid:
      return t.payment.statusLabels.partiallyPaid;
    case PaymentStatus.Finished:
      return t.payment.statusLabels.finished;
    case PaymentStatus.Failed:
      return t.payment.statusLabels.failed;
    case PaymentStatus.Refunded:
      return t.payment.statusLabels.refunded;
    case PaymentStatus.Expired:
      return t.payment.statusLabels.expired;
    default:
      return status;
  }
}
