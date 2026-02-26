/**
 * Payment History Tab Component
 */

import { useCallback, useEffect, useState } from 'react';

import { Loading } from '@/components/custom/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePayment } from '@/hooks/use-payment';
import { cn } from '@/lib/utils';
import type { PaymentHistory } from '@/types/payment';

import { getStatusBadgeColor, getStatusLabel } from './payment-utils';

interface PaymentHistoryTabProps {
  isActive: boolean;
  onViewPayment: (paymentId: string) => void;
  onSwitchToBuy: () => void;
}

export default function PaymentHistoryTab({
  isActive,
  onViewPayment,
  onSwitchToBuy,
}: PaymentHistoryTabProps) {
  const { getPaymentHistory } = usePayment();
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPaymentHistory();
      setHistory(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }, [getPaymentHistory]);

  useEffect(() => {
    if (isActive) {
      fetchHistory();
    }
  }, [isActive, fetchHistory]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-8">
          <Loading disclaimer="Loading payment history…" />
        </div>
      ) : history.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Payment History</CardTitle>
            <CardDescription>
              You haven't made any payments yet. Purchase credits to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onSwitchToBuy} className="w-full">
              Buy Credits
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Payment ID</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((payment) => (
                <TableRow key={payment.payment_id}>
                  <TableCell className="text-sm">
                    {new Date(payment.created_at).toLocaleDateString()}{' '}
                    {new Date(payment.created_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="text-sm font-mono">{payment.payment_id}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {payment.credits_amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {payment.pay_amount && payment.pay_currency
                      ? `${payment.pay_amount} ${payment.pay_currency.toUpperCase()}`
                      : 'N/A'}
                    <div className="text-xs text-muted-foreground">${payment.price_amount} USD</div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full font-medium',
                        getStatusBadgeColor(payment.status)
                      )}
                    >
                      {getStatusLabel(payment.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewPayment(payment.payment_id ?? '')}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
