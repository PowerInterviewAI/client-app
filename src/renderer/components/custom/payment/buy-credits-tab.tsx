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
import { usePayment } from '@/hooks/use-payment';
import { CREDITS_PER_MINUTE } from '@/lib/consts';
import { cn } from '@/lib/utils';
import type { AvailableCurrency, CreditPlanInfo } from '@/types/payment';
import { CreditPlan } from '@/types/payment';

const planNames: Record<CreditPlan, string> = {
  [CreditPlan.Starter]: 'Starter',
  [CreditPlan.Pro]: 'Pro',
  [CreditPlan.Enterprise]: 'Enterprise',
};

const planDescriptions: Record<CreditPlan, string> = {
  [CreditPlan.Starter]: 'Perfect for trying out the platform',
  [CreditPlan.Pro]: 'Best value for serious job seekers',
  [CreditPlan.Enterprise]: 'For heavy users and teams',
};

interface BuyCreditsTabProps {
  credits: number;
  onPaymentCreated: (paymentId: string) => void;
}

export default function BuyCreditsTab({ credits, onPaymentCreated }: BuyCreditsTabProps) {
  const { plans, currencies, loading, error, createPayment } = usePayment();
  const [selectedPlan, setSelectedPlan] = useState<CreditPlanInfo | null>(null);
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

  const availableMinutes = Math.floor(credits / CREDITS_PER_MINUTE);
  const availableHours = Math.floor(availableMinutes / 60);
  const availableRemMinutes = availableMinutes % 60;

  const handleSelectPlan = useCallback((plan: CreditPlanInfo) => {
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
        <div className="text-xs font-medium">Current Balance</div>
        <div className="text-lg font-bold">{credits.toLocaleString()} credits</div>
        <div className="text-xs text-muted-foreground">
          Available for ~
          {availableHours > 0 && (
            <>
              {availableHours} hour{availableHours !== 1 ? 's' : ''}
              {availableRemMinutes > 0 ? ' ' : ''}
            </>
          )}
          {availableRemMinutes > 0 && (
            <>
              {availableRemMinutes} minute{availableRemMinutes !== 1 ? 's' : ''}
            </>
          )}{' '}
          (10 credits per minute)
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {loading && plans.length === 0 ? (
        <div className="py-6">
          <Loading disclaimer="Loading payment plans…" />
        </div>
      ) : (
        <>
          <div className="mx-auto grid gap-2 md:grid-cols-3">
            {plans.map((plan) => {
              const isPro = plan.plan === CreditPlan.Pro;
              const isSelected = selectedPlan?.plan === plan.plan;
              const minutes = Math.floor(plan.credits / CREDITS_PER_MINUTE);
              const planName = planNames[plan.plan] || plan.plan;
              const planDescription = planDescriptions[plan.plan] || plan.description || '';

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
                        Most Popular
                      </span>
                    </div>
                  )}

                  <CardHeader className="gap-1 px-4">
                    <CardTitle className="text-lg">{planName}</CardTitle>
                    <CardDescription className="text-xs">{planDescription}</CardDescription>
                    <div className="mt-2">
                      <span className="text-2xl font-bold">${plan.priceUsd}</span>
                      <span className="text-xs text-muted-foreground">
                        {' '}
                        / {plan.credits.toLocaleString()} credits
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ~{minutes.toLocaleString()} minutes of AI assistance
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
                          Selected
                        </>
                      ) : (
                        'Buy'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedPlan && (
            <Card ref={paymentDetailsRef} className="gap-3 py-4">
              <CardHeader className="gap-1 px-4">
                <CardTitle className="text-base">Payment Details</CardTitle>
                <CardDescription className="text-xs">
                  Complete your purchase of{' '}
                  <span className="font-bold">{selectedPlan.credits.toLocaleString()} credits</span>{' '}
                  for <span className="font-bold">${selectedPlan.priceUsd} USD</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">
                    Payment Currency <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={selectedCurrency}
                    onValueChange={setSelectedCurrency}
                    open={currencySelectOpen}
                    onOpenChange={handleCurrencySelectOpenChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a currency" />
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
                            placeholder="Search currency..."
                            className="h-8 pl-7 text-xs"
                          />
                        </div>
                      </div>
                      {!hasVisibleCurrency ? (
                        <div className="py-4 text-center text-xs text-muted-foreground">
                          No currency found
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
                  {creating ? 'Creating Payment...' : 'Create Payment'}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
