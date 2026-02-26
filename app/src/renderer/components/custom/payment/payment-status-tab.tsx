/**
 * Payment Status Tab Component
 */

import { useCallback, useState } from 'react';
import { QrcodeCanvas, useQrcodeDownload } from 'react-qrcode-pretty';
import { toast } from 'sonner';

import logoQr from '/logo-qr.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePayment } from '@/hooks/use-payment';
import { cn } from '@/lib/utils';
import type { PaymentStatusResponse } from '@/types/payment';
import { PaymentStatus } from '@/types/payment';

import { getStatusBadgeColor, getStatusLabel } from './payment-utils';

interface PaymentStatusTabProps {
  initialPaymentId?: string;
}

export default function PaymentStatusTab({ initialPaymentId = '' }: PaymentStatusTabProps) {
  const { getPaymentStatus } = usePayment();
  const [paymentId, setPaymentId] = useState(initialPaymentId);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setQrcode, downloadQrcode, isQrcodeReady] = useQrcodeDownload('payment');

  const handleCheckStatus = useCallback(
    async (id?: string) => {
      const checkId = id || paymentId;
      if (!checkId) return;

      setLoading(true);
      setError(null);
      try {
        const status = await getPaymentStatus(checkId);
        if (status) {
          setPaymentStatus(status);
        } else {
          setError('Payment not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch payment status');
      } finally {
        setLoading(false);
      }
    },
    [paymentId, getPaymentStatus]
  );

  const handleCopyAddress = useCallback(() => {
    if (paymentStatus?.pay_address) {
      navigator.clipboard.writeText(paymentStatus.pay_address);
      toast.success('Payment address copied to clipboard');
    }
  }, [paymentStatus]);

  // Generate payment URI for wallet apps (includes amount)
  const getPaymentUri = useCallback(() => {
    if (!paymentStatus) return '';

    const { pay_address, pay_amount, pay_currency } = paymentStatus;
    const currency = pay_currency.toLowerCase();

    // For most cryptocurrencies, the format is: currency:address?amount=value
    // This is BIP21 for Bitcoin and similar standards for other cryptos
    return `${currency}:${pay_address}?amount=${pay_amount}`;
  }, [paymentStatus]);

  // Auto-check if initialPaymentId changes
  useState(() => {
    if (initialPaymentId) {
      setPaymentId(initialPaymentId);
      setTimeout(() => {
        handleCheckStatus(initialPaymentId);
      }, 100);
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Check Payment Status</CardTitle>
          <CardDescription>Enter a payment ID to check its current status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter payment ID"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              className="max-w-40"
            />
            <Button onClick={() => handleCheckStatus()} disabled={!paymentId || loading}>
              {loading ? 'Checking...' : 'Check Status'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {paymentStatus && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  <span
                    className={cn(
                      'px-3 -ml-1 py-1 rounded-full text-sm',
                      getStatusBadgeColor(paymentStatus.payment_status)
                    )}
                  >
                    {getStatusLabel(paymentStatus.payment_status)}
                  </span>
                </CardTitle>
                <CardDescription className="mt-2">Order #{paymentStatus.order_id}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Amount to Pay</p>
                <p className="text-lg font-semibold">
                  {paymentStatus.pay_amount} {paymentStatus.pay_currency.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price (USD)</p>
                <p className="text-lg font-semibold">
                  ${paymentStatus.price_amount} {paymentStatus.price_currency}
                </p>
              </div>
              {paymentStatus.actually_paid != null && paymentStatus.actually_paid > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Actually Paid</p>
                  <p className="text-lg font-semibold">
                    {paymentStatus.actually_paid} {paymentStatus.pay_currency.toUpperCase()}
                  </p>
                </div>
              )}
            </div>

            {paymentStatus.payment_status !== PaymentStatus.Finished &&
              paymentStatus.payment_status !== PaymentStatus.Failed &&
              paymentStatus.payment_status !== PaymentStatus.Expired && (
                <>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-3">Payment Methods</p>
                    <Tabs defaultValue="qr" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="qr">QR Code</TabsTrigger>
                        <TabsTrigger value="address">Address</TabsTrigger>
                      </TabsList>

                      <TabsContent value="qr" className="mt-4">
                        <div className="flex flex-col items-center space-y-3">
                          <QrcodeCanvas
                            value={getPaymentUri()}
                            size={240}
                            level="Q"
                            variant={{
                              eyes: 'standard',
                              body: 'standard',
                            }}
                            color={{
                              eyes: '#000',
                              body: '#222',
                            }}
                            padding={16}
                            margin={0}
                            bgColor="#fff"
                            bgRounded
                            image={{
                              src: logoQr,
                              overlap: true,
                            }}
                            onReady={setQrcode}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadQrcode(`payment-${paymentStatus.order_id}`)}
                            disabled={!isQrcodeReady}
                          >
                            Download QR Code
                          </Button>
                          <p className="text-sm text-muted-foreground text-center">
                            Scan with your wallet app
                          </p>
                          <p className="text-xs text-muted-foreground text-center">
                            QR code includes address and amount ({paymentStatus.pay_amount}{' '}
                            {paymentStatus.pay_currency.toUpperCase()})
                          </p>
                        </div>
                      </TabsContent>

                      <TabsContent value="address" className="mt-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-2">Payment Address</p>
                            <div className="flex gap-2 items-center">
                              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                                {paymentStatus.pay_address}
                              </code>
                              <Button size="sm" variant="secondary" onClick={handleCopyAddress}>
                                Copy
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">Amount to Send</p>
                            <p className="text-lg font-semibold">
                              {paymentStatus.pay_amount} {paymentStatus.pay_currency.toUpperCase()}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Send exactly this amount to the address above.
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </>
              )}

            {paymentStatus.payment_status === PaymentStatus.Finished && (
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Payment Successful!
                </p>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  Your credits have been added to your account.
                </p>
              </div>
            )}

            {(paymentStatus.payment_status === PaymentStatus.Failed ||
              paymentStatus.payment_status === PaymentStatus.Expired) && (
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Payment{' '}
                  {paymentStatus.payment_status === PaymentStatus.Expired ? 'Expired' : 'Failed'}
                </p>
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  {paymentStatus.payment_status === PaymentStatus.Expired
                    ? 'This payment has expired. Please create a new payment.'
                    : 'The payment could not be processed. Please try again.'}
                </p>
              </div>
            )}

            {(paymentStatus.created_at || paymentStatus.updated_at) && (
              <div className="border-t pt-4 space-y-2 text-sm">
                {paymentStatus.created_at && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(paymentStatus.created_at).toLocaleString()}</span>
                  </div>
                )}
                {paymentStatus.updated_at && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Updated:</span>
                    <span>{new Date(paymentStatus.updated_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
