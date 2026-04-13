/**
 * Payment utility functions
 */

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

export function getStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.Waiting:
      return 'Waiting';
    case PaymentStatus.Confirming:
      return 'Confirming';
    case PaymentStatus.Confirmed:
      return 'Confirmed';
    case PaymentStatus.Sending:
      return 'Sending';
    case PaymentStatus.PartiallyPaid:
      return 'Partially Paid';
    case PaymentStatus.Finished:
      return 'Finished';
    case PaymentStatus.Failed:
      return 'Failed';
    case PaymentStatus.Refunded:
      return 'Refunded';
    case PaymentStatus.Expired:
      return 'Expired';
    default:
      return status;
  }
}
