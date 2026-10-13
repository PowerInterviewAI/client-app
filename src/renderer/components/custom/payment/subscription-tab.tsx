import { Check, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Loading } from '@/components/custom/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNow } from '@/hooks/use-now';
import { usePayment } from '@/hooks/use-payment';
import { useT } from '@/i18n';
import { minutesCovered } from '@/lib/credit-gate';
import { daysLeft, planKey, type SubscriptionSummary } from '@/lib/subscription';
import { cn } from '@/lib/utils';
import type { AvailableCurrency, SubscriptionPlanInfo } from '@/types/payment';

interface SubscriptionTabProps {
  /** The free-tier balance, in credits. */
  credits: number;
  subscription: SubscriptionSummary;
  /** From the backend ping; falls back to the compiled-in mirror while that has not arrived. */
  creditsPerMinute?: number;
  onPaymentCreated: (paymentId: string) => void;
}

/** How much cheaper a pass is per month than the dearest one on offer, in whole percent. */
function savingPercent(plan: SubscriptionPlanInfo, plans: SubscriptionPlanInfo[]): number {
  const dearest = Math.max(...plans.map((p) => p.pricePerMonthUsd));
  if (dearest <= 0) return 0;
  return Math.round(((dearest - plan.pricePerMonthUsd) / dearest) * 100);
}

export default function SubscriptionTab({
  credits,
  subscription,
  creditsPerMinute,
  onPaymentCreated,
}: SubscriptionTabProps) {
  const t = useT();
  const { plans, currencies, loading, error, createPayment } = usePayment();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanInfo | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [currencySelectOpen, setCurrencySelectOpen] = useState(false);
  const paymentDetailsRef = useRef<HTMLDivElement>(null);
  const currencySearchInputRef = useRef<HTMLInputElement>(null);

  const currencyMatches = useCallback(
    (currency: AvailableCurrency) => {
      const terms = currencySearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (terms.length === 0) return true;
      const haystack = `${currency.name} ${currency.code}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    },
    [currencySearch]
  );

  const hasVisibleCurrency = useMemo(
    () => currencies.some((currency) => currencyMatches(currency)),
    [currencies, currencyMatches]
  );

  useEffect(() => {
    if (!currencySelectOpen) return;
    const id = setTimeout(() => currencySearchInputRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, [currencySelectOpen]);

  const handleCurrencySelectOpenChange = useCallback((open: boolean) => {
    setCurrencySelectOpen(open);
    if (!open) setCurrencySearch('');
  }, []);

  const now = useNow();
  const freeMinutes = minutesCovered(credits, creditsPerMinute);
  const active = subscription.subscribed && subscription.expiresAt !== null;

  const handleSelectPlan = useCallback((plan: SubscriptionPlanInfo) => {
    setSelectedPlan(plan);
    setTimeout(() => {
      paymentDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }, []);

  const handleCreatePayment = useCallback(async () => {
    if (!selectedPlan) return;

    setCreating(true);
    try {
      const payment = await createPayment({
        plan: selectedPlan.plan,
        pay_currency: selectedCurrency || undefined,
      });

      if (payment) {
        onPaymentCreated(payment.payment_id);
      }
    } catch (err) {
      console.error('Failed to create payment:', err);
    } finally {
      setCreating(false);
    }
  }, [selectedPlan, selectedCurrency, createPayment, onPaymentCreated]);

  return (
    <div className="space-y-3">
      <div className="bg-muted/50 p-3 rounded-lg">
        <div className="text-xs font-medium">{t.payment.buy.currentPlan}</div>
        {active && subscription.expiresAt !== null ? (
          <>
            <div className="text-lg font-bold">
              {t.payment.buy.subscribedUntil(
                t.creditsDisplay.planNames[planKey(subscription.plan)],
                t.creditsDisplay.date(subscription.expiresAt)
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {t.payment.buy.daysLeft(daysLeft(subscription.expiresAt, now))}.{' '}
              {t.payment.buy.extends}
            </div>
          </>
        ) : (
          <>
            <div className="text-lg font-bold">{t.payment.buy.freePlan}</div>
            {/* Assembled in the locale rather than out of JSX fragments: the hours and minutes
                each take their own plural form, and which one is a property of the number. */}
            <div className="text-xs text-muted-foreground">
              {freeMinutes > 0
                ? t.payment.buy.freeLeft(
                    t.payment.buy.duration(Math.floor(freeMinutes / 60), freeMinutes % 60)
                  )
                : t.payment.buy.freeUsedUp}
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {loading && plans.length === 0 ? (
        <div className="py-6">
          <Loading disclaimer={t.payment.buy.loadingPlans} />
        </div>
      ) : (
        <>
          <div className="mx-auto grid gap-2 md:grid-cols-2">
            {plans.map((plan) => {
              const isPro = plan.popular;
              const isSelected = selectedPlan?.plan === plan.plan;
              const key = planKey(plan.plan);
              const planName = key === 'other' ? plan.plan : t.payment.buy.planNames[key];
              const planDescription = key === 'other' ? '' : t.payment.buy.planDescriptions[key];
              const saving = savingPercent(plan, plans);

              return (
                <Card
                  key={plan.plan}
                  className={cn(
                    'relative flex flex-col gap-3 py-4 transition-all duration-150',
                    isPro
                      ? 'border-primary shadow-lg hover:shadow-xl'
                      : 'shadow-sm hover:shadow-lg',
                    isSelected
                      ? 'ring-2 ring-primary bg-primary/5 shadow-xl -translate-y-0.5'
                      : 'hover:-translate-y-0.5'
                  )}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}

                  {isPro && (
                    <div className="absolute -top-3 left-0 right-0 flex justify-center">
                      <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                        {t.payment.buy.mostPopular}
                      </span>
                    </div>
                  )}

                  <CardHeader className="gap-1 px-4">
                    <CardTitle className="text-lg">{planName}</CardTitle>
                    <CardDescription className="text-xs">{planDescription}</CardDescription>
                    <div className="mt-2">
                      <span className="text-2xl font-bold">${plan.pricePerMonthUsd}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.payment.buy.perMonth}
                      </span>
                      {saving > 0 && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {t.payment.buy.save(saving)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.payment.buy.billedAs(plan.priceUsd, plan.days)}
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 px-4 pt-0">
                    <Button
                      size="sm"
                      className={cn(
                        'w-full cursor-pointer',
                        isSelected
                          ? ''
                          : isPro
                            ? ''
                            : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                      )}
                      variant={isSelected || isPro ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlan(plan);
                      }}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          {t.payment.buy.selected}
                        </>
                      ) : (
                        t.payment.buy.buy
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground">{t.payment.buy.prepaid}</p>

          {selectedPlan && (
            <Card ref={paymentDetailsRef} className="gap-3 py-4">
              <CardHeader className="gap-1 px-4">
                <CardTitle className="text-base">{t.payment.buy.detailsTitle}</CardTitle>
                <CardDescription className="text-xs">
                  {t.payment.buy.detailsLead}
                  <span className="font-bold">
                    {planKey(selectedPlan.plan) === 'other'
                      ? selectedPlan.plan
                      : t.payment.buy.planNames[planKey(selectedPlan.plan) as 'monthly' | 'yearly']}
                  </span>
                  {t.payment.buy.detailsFor}
                  <span className="font-bold">${selectedPlan.priceUsd} USD</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">
                    {t.payment.buy.currencyLabel} <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={selectedCurrency}
                    onValueChange={setSelectedCurrency}
                    open={currencySelectOpen}
                    onOpenChange={handleCurrencySelectOpenChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.payment.buy.currencyPlaceholder} />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      <div className="sticky top-0 z-10 -mx-1 -mt-1 mb-1 border-b bg-popover p-1.5">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            ref={currencySearchInputRef}
                            value={currencySearch}
                            onChange={(e) => setCurrencySearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key !== 'Escape') e.stopPropagation();
                            }}
                            placeholder={t.payment.buy.currencySearchPlaceholder}
                            className="h-8 pl-7 text-xs"
                          />
                        </div>
                      </div>
                      {!hasVisibleCurrency ? (
                        <div className="py-4 text-center text-xs text-muted-foreground">
                          {t.payment.buy.noCurrency}
                        </div>
                      ) : (
                        currencies.map((currency: AvailableCurrency) => (
                          <SelectItem
                            key={currency.code}
                            value={currency.code}
                            className={cn(!currencyMatches(currency) && 'hidden')}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={currency.logo_url}
                                alt={currency.name}
                                className="w-4 h-4"
                              />
                              <span>
                                {currency.name} ({currency.code.toUpperCase()})
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleCreatePayment}
                  disabled={creating || !selectedCurrency}
                >
                  {creating ? t.payment.buy.creatingPayment : t.payment.buy.createPayment}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
