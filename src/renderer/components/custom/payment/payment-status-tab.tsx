/**
 * Payment Status Tab Component
 */

import {
  CircleCheck,
  Copy,
  CopyCheck,
  FileIcon,
  FolderOpenIcon,
  RefreshCw,
  XIcon,
} from 'lucide-react';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QrcodeCanvas, useQrcodeDownload } from 'react-qrcode-pretty';
import { toast } from 'sonner';

import logoQr from '/logo-qr.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePayment } from '@/hooks/use-payment';
import { type Translation, useT } from '@/i18n';
import { cn, getElectron } from '@/lib/utils';
import type { PaymentStatusResponse } from '@/types/payment';
import { PaymentStatus } from '@/types/payment';

import { getStatusBadgeColor, getStatusLabel } from './payment-utils';

// separate memoized QR canvas to avoid redraws when parent re-renders
interface MemoQrProps {
  /** The dictionary, so the memo comparison below can treat a language change as a change. */
  t: Translation;
  paymentUri: string;
  setQrcode: (canvas: HTMLCanvasElement | SVGSVGElement) => void;
  isQrcodeReady: boolean;
  orderId: string; // memo comparison only
  onDownload: () => void;
}

const QrComponent: React.FC<MemoQrProps> = ({
  t,
  paymentUri,
  setQrcode,
  isQrcodeReady,
  onDownload,
}) => (
  <>
    <QrcodeCanvas
      value={paymentUri}
      size={320}
      level="Q"
      variant={{
        eyes: 'standard',
        body: 'standard',
      }}
      color={{
        eyes: '#312',
        body: '#312',
      }}
      padding={16}
      margin={0}
      bgColor="#f3f1f2"
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
      onClick={onDownload}
      disabled={!isQrcodeReady}
      className="cursor-pointer"
    >
      {t.payment.status.downloadQr}
    </Button>
  </>
);

const MemoQr = memo(
  QrComponent,
  (prev, next) =>
    prev.t === next.t &&
    prev.paymentUri === next.paymentUri &&
    prev.isQrcodeReady === next.isQrcodeReady &&
    prev.orderId === next.orderId
);

interface PaymentStatusTabProps {
  initialPaymentId?: string;
}

export default function PaymentStatusTab({ initialPaymentId = '' }: PaymentStatusTabProps) {
  const t = useT();
  const { getPaymentStatus } = usePayment();
  const [paymentId, setPaymentId] = useState(initialPaymentId);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setQrcode, , isQrcodeReady] = useQrcodeDownload('payment');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleQrcodeReady = useCallback(
    (canvas: HTMLCanvasElement | SVGSVGElement) => {
      setQrcode(canvas);
      if (canvas instanceof HTMLCanvasElement) canvasRef.current = canvas;
    },
    [setQrcode]
  );

  const handleDownloadQr = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    const data = Array.from(new Uint8Array(await blob.arrayBuffer()));
    const filename = `payment-${paymentStatus?.order_id ?? 'qr'}.png`;
    const result = await getElectron()?.tools.saveImage({ filename, data });
    const filePath = result?.filePath;
    if (!filePath) return;
    const electron = getElectron();
    const toastId = `qr-${Date.now()}`;
    toast.custom(
      () => (
        <div
          className="flex items-center gap-2 w-full px-4 py-3 rounded-lg border shadow-md"
          style={{
            background: 'var(--success-bg)',
            borderColor: 'var(--success-border)',
            color: 'var(--success-text)',
          }}
        >
          <CircleCheck className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-sm font-medium">{t.payment.status.qrSaved}</span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0"
                  onClick={() => electron?.openFile(filePath)}
                >
                  <FileIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t.exportToast.openFile}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0"
                  onClick={() => electron?.showInFolder(filePath)}
                >
                  <FolderOpenIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t.exportToast.showInFolder}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => toast.dismiss(toastId)}
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t.exportToast.dismiss}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      ),
      { id: toastId, duration: 10_000, style: { width: 'var(--width, 356px)' } }
    );
  }, [paymentStatus?.order_id, t]);

  const paymentStatusRef = React.useRef<PaymentStatusResponse | null>(null);

  const handleCheckStatus = useCallback(
    async (id?: string, silent = false) => {
      const checkId = id || paymentId;
      if (!checkId) return;

      if (!silent) setLoading(true);
      if (silent) setRefreshing(true);
      setError(null);
      try {
        const status = await getPaymentStatus(checkId);
        if (status) {
          // only update state if the object really changed
          const prev = paymentStatusRef.current;
          if (JSON.stringify(prev) !== JSON.stringify(status)) {
            setPaymentStatus(status);
            paymentStatusRef.current = status;
          }
        } else {
          setError(t.payment.status.notFound);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t.payment.status.fetchFailed);
      } finally {
        if (!silent) setLoading(false);
        if (silent) setRefreshing(false);
      }
    },
    [paymentId, getPaymentStatus, t]
  );

  type CopyField = 'address' | 'amount' | 'currency';
  const [copiedField, setCopiedField] = useState<CopyField | null>(null);
  const copiedFieldTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copiedFieldTimeoutRef.current) window.clearTimeout(copiedFieldTimeoutRef.current);
    },
    []
  );

  const copyToClipboard = useCallback((text: string, field: CopyField, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
    setCopiedField(field);
    if (copiedFieldTimeoutRef.current) window.clearTimeout(copiedFieldTimeoutRef.current);
    copiedFieldTimeoutRef.current = window.setTimeout(() => setCopiedField(null), 1500);
  }, []);

  const handleCopyAddress = useCallback(() => {
    if (paymentStatus?.pay_address) {
      copyToClipboard(paymentStatus.pay_address, 'address', t.payment.status.addressCopied);
    }
  }, [paymentStatus, copyToClipboard, t]);

  const handleCopyAmount = useCallback(() => {
    if (paymentStatus?.pay_amount != null) {
      copyToClipboard(String(paymentStatus.pay_amount), 'amount', t.payment.status.amountCopied);
    }
  }, [paymentStatus, copyToClipboard, t]);

  const handleCopyCurrency = useCallback(() => {
    if (paymentStatus?.pay_currency) {
      copyToClipboard(
        paymentStatus.pay_currency.toUpperCase(),
        'currency',
        t.payment.status.currencyCopied
      );
    }
  }, [paymentStatus, copyToClipboard, t]);

  // Generate payment URI for wallet apps (includes amount)
  // memoized so it only recalculates when status changes
  const paymentUri = useMemo(() => {
    if (!paymentStatus) return '';

    const { pay_address, pay_amount, pay_currency } = paymentStatus;
    const currency = pay_currency.toLowerCase();

    // For most cryptocurrencies, the format is: currency:address?amount=value
    // This is BIP21 for Bitcoin and similar standards for other cryptos
    return `${currency}:${pay_address}?amount=${pay_amount}`;
  }, [paymentStatus]);

  // Auto-check if initialPaymentId changes
  useEffect(() => {
    if (initialPaymentId) {
      setPaymentId(initialPaymentId);
      setTimeout(() => {
        handleCheckStatus(initialPaymentId);
      }, 100);
    }
  }, [initialPaymentId, handleCheckStatus]);

  // poll for status every 5 seconds while we have an ID and the payment
  // hasn't reached a terminal state. this keeps the UI up‑to‑date without
  // requiring manual clicks.
  useEffect(() => {
    let interval: number | null = null;
    const isTerminal =
      paymentStatus !== null &&
      [PaymentStatus.Finished, PaymentStatus.Failed, PaymentStatus.Expired].includes(
        paymentStatus.payment_status
      );

    // only poll when there's an ID and the payment hasn't reached a final state
    if (paymentId && !isTerminal) {
      interval = window.setInterval(() => handleCheckStatus(undefined, true), 5000);
    }

    return () => {
      if (interval !== null) window.clearInterval(interval);
    };
  }, [paymentId, paymentStatus, handleCheckStatus]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.payment.status.title}</CardTitle>
          <CardDescription>{t.payment.status.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t.payment.status.idPlaceholder}
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              className="max-w-40"
              maxLength={100}
            />
            <Button onClick={() => handleCheckStatus()} disabled={!paymentId || loading}>
              {loading ? t.payment.status.checking : t.payment.status.check}
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
                    {getStatusLabel(t, paymentStatus.payment_status)}
                  </span>
                </CardTitle>
                <CardDescription className="mt-2">
                  {t.payment.status.order(paymentStatus.order_id)}
                </CardDescription>
              </div>
              <span
                className={cn(
                  'flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity duration-300',
                  refreshing ? 'opacity-100' : 'opacity-0'
                )}
              >
                <RefreshCw className="h-3 w-3 animate-spin" />
                {t.payment.status.refreshing}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t.payment.status.amountToPay}</p>
                <p className="text-lg font-semibold">
                  {paymentStatus.pay_amount} {paymentStatus.pay_currency.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.payment.status.priceUsd}</p>
                <p className="text-lg font-semibold">
                  ${paymentStatus.price_amount} {paymentStatus.price_currency}
                </p>
              </div>
              {paymentStatus.actually_paid != null && paymentStatus.actually_paid > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">{t.payment.status.actuallyPaid}</p>
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
                    <p className="text-sm font-medium mb-3">{t.payment.status.paymentMethods}</p>
                    <Tabs defaultValue="qr" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="qr">{t.payment.status.qrTab}</TabsTrigger>
                        <TabsTrigger value="address">{t.payment.status.addressTab}</TabsTrigger>
                      </TabsList>

                      <TabsContent value="qr" className="mt-4">
                        <div className="flex flex-col items-center space-y-3">
                          <MemoQr
                            t={t}
                            paymentUri={paymentUri}
                            setQrcode={handleQrcodeReady}
                            isQrcodeReady={isQrcodeReady}
                            orderId={paymentStatus.order_id}
                            onDownload={handleDownloadQr}
                          />
                          <p className="text-sm text-muted-foreground text-center">
                            {t.payment.status.scanWithWallet}
                          </p>
                          <p className="text-xs text-muted-foreground text-center">
                            {t.payment.status.qrIncludes(
                              `${paymentStatus.pay_amount} ${paymentStatus.pay_currency.toUpperCase()}`
                            )}
                          </p>
                        </div>
                      </TabsContent>

                      <TabsContent value="address" className="mt-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-2">
                              {t.payment.status.paymentAddress}
                            </p>
                            <div className="flex gap-2 items-center">
                              <Button size="sm" variant="secondary" onClick={handleCopyAddress}>
                                {copiedField === 'address' ? (
                                  <CopyCheck className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <code className="flex-1 bg-muted p-2 rounded text-sm">
                                {paymentStatus.pay_address}
                              </code>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">
                              {t.payment.status.amountToSend}
                            </p>
                            <div className="flex gap-2">
                              <div className="flex flex-1 gap-2 items-center">
                                <Button size="sm" variant="secondary" onClick={handleCopyAmount}>
                                  {copiedField === 'amount' ? (
                                    <CopyCheck className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <code className="flex-1 bg-muted p-2 rounded text-sm">
                                  {paymentStatus.pay_amount}
                                </code>
                              </div>
                              <div className="flex gap-2 items-center">
                                <Button size="sm" variant="secondary" onClick={handleCopyCurrency}>
                                  {copiedField === 'currency' ? (
                                    <CopyCheck className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <code className="bg-muted p-2 rounded text-sm">
                                  {paymentStatus.pay_currency.toUpperCase()}
                                </code>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t.payment.status.sendExactly}
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
                  {t.payment.status.successTitle}
                </p>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  {t.payment.status.successBody}
                </p>
              </div>
            )}

            {(paymentStatus.payment_status === PaymentStatus.Failed ||
              paymentStatus.payment_status === PaymentStatus.Expired) && (
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  {paymentStatus.payment_status === PaymentStatus.Expired
                    ? t.payment.status.expiredTitle
                    : t.payment.status.failedTitle}
                </p>
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  {paymentStatus.payment_status === PaymentStatus.Expired
                    ? t.payment.status.expiredBody
                    : t.payment.status.failedBody}
                </p>
              </div>
            )}

            {(paymentStatus.created_at || paymentStatus.updated_at) && (
              <div className="border-t pt-4 space-y-2 text-sm">
                {paymentStatus.created_at && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t.payment.status.created}</span>
                    <span>{new Date(paymentStatus.created_at).toLocaleString()}</span>
                  </div>
                )}
                {paymentStatus.updated_at && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t.payment.status.updated}</span>
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
