/**
 * Buy Credits Tab Component
 */

import { Check } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { Loading } from '@/components/custom/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

// Plan features configuration
const planFeatures: Record<CreditPlan, string[]> = {
  [CreditPlan.Starter]: [
    'Real-time transcription',
    'AI reply suggestions',
    'Code assistance',
    'Face swap feature',
  ],
  [CreditPlan.Pro]: [
    'Real-time transcription',
    'AI reply suggestions',
    'Code assistance',
    'Face swap feature',
    'Priority support',
  ],
  [CreditPlan.Enterprise]: [
    'Real-time transcription',
    'AI reply suggestions',
    'Code assistance',
    'Face swap feature',
    'Priority support',
    'Dedicated account manager',
  ],
};

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
  const paymentDetailsRef = useRef<HTMLDivElement>(null);

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
    <div className="space-y-4">
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="text-sm font-medium">Current Balance</div>
        <div className="text-2xl font-bold">{credits.toLocaleString()} credits</div>
        <div className="text-sm text-muted-foreground">
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
        <div className="py-8">
          <Loading disclaimer="Loading payment plans…" />
        </div>
      ) : (
        <>
          <div className="mx-auto grid gap-2 md:grid-cols-3 p-1">
            {plans.map((plan) => {
              const isPro = plan.plan === CreditPlan.Pro;
              const minutes = Math.floor(plan.credits / CREDITS_PER_MINUTE);
              const features = planFeatures[plan.plan] || [];
              const planName = planNames[plan.plan] || plan.plan;
              const planDescription = planDescriptions[plan.plan] || plan.description || '';

              return (
                <Card
                  key={plan.plan}
                  className={cn(
                    'relative flex flex-col transition-shadow',
                    isPro
                      ? 'border-primary shadow-lg hover:shadow-xl'
                      : 'shadow-sm hover:shadow-lg',
                    selectedPlan?.plan === plan.plan && 'ring-2 ring-primary'
                  )}
                >
                  {isPro && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <span className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <CardHeader className={cn(isPro && 'pt-8')}>
                    <CardTitle className="text-2xl">{planName}</CardTitle>
                    <CardDescription>{planDescription}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${plan.priceUsd}</span>
                      <span className="text-muted-foreground">
                        {' '}
                        / {plan.credits.toLocaleString()} credits
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      ~{minutes.toLocaleString()} minutes of AI assistance
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 pt-0">
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <Check className="mr-2 h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm">
                          {plan.credits.toLocaleString()} credits (~{minutes.toLocaleString()}{' '}
                          minutes)
                        </span>
                      </li>
                      {features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check className="mr-2 h-5 w-5 shrink-0 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={cn(
                        'mt-6 w-full cursor-pointer',
                        isPro
                          ? ''
                          : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                      )}
                      variant={isPro ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlan(plan);
                      }}
                    >
                      Buy
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedPlan && (
            <Card ref={paymentDetailsRef}>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>
                  Complete your purchase of{' '}
                  <span className="font-bold">{selectedPlan.credits.toLocaleString()} credits</span>{' '}
                  for <span className="font-bold">${selectedPlan.priceUsd} USD</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Payment Currency <span className="text-destructive">*</span>
                  </label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency: AvailableCurrency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <img src={currency.logo_url} alt={currency.name} className="w-4 h-4" />
                            <span>
                              {currency.name} ({currency.code.toUpperCase()})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
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
