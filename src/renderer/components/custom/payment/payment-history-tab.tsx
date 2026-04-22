/**
 * Payment History Tab Component
 */

import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const historyRef = useRef<PaymentHistory[]>(history);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const fetchHistory = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      if (silent) setRefreshing(true);
      setError(null);
      try {
        const result = await getPaymentHistory();
        // only update state when new data differs from the current list
        if (JSON.stringify(result) !== JSON.stringify(historyRef.current)) {
          setHistory(result);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment history');
      } finally {
        if (!silent) setLoading(false);
        if (silent) setRefreshing(false);
      }
    },
    [getPaymentHistory]
  );

  useEffect(() => {
    let interval: number | null = null;

    if (isActive) {
      // load immediately (show spinner on first load)
      fetchHistory();
      // background polls are silent - no spinner flash
      interval = window.setInterval(() => fetchHistory(true), 5000);
    }

    return () => {
      if (interval !== null) window.clearInterval(interval);
    };
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
          <div className="flex items-center justify-end px-4 py-2 border-b">
            <span
              className={cn(
                'flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity duration-300',
                refreshing ? 'opacity-100' : 'opacity-0'
              )}
            >
              <RefreshCw className="h-3 w-3 animate-spin" />
              Refreshing…
            </span>
          </div>
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
              {history.slice(0, 30).map((payment) => (
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
