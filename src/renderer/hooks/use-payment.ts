/**
 * Payment hook
 * Provides payment functionality to React components
 */

import { useCallback, useEffect, useState } from 'react';

import { useT } from '@/i18n';
import type {
  AvailableCurrency,
  CreatePaymentRequest,
  CreatePaymentResponse,
  CreditPlanInfo,
  PaymentHistory,
  PaymentStatusResponse,
} from '@/types/payment';

export function usePayment() {
  // Only reached for a failure the backend did not describe. Every callback below takes `t` as a
  // dependency: they are memoised and close over it, so without that a language change would
  // leave the old wording in place for the rest of the session.
  const t = useT();
  const [plans, setPlans] = useState<CreditPlanInfo[]>([]);
  const [currencies, setCurrencies] = useState<AvailableCurrency[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get available plans
  const getPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.electronAPI?.payment.getPlans();
      if (result?.success && result.data) {
        setPlans(result.data);
      } else {
        throw new Error(result?.error || t.payment.errors.getPlans);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.payment.errors.getPlans);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Get available currencies
  const getCurrencies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.electronAPI?.payment.getCurrencies();
      if (result?.success && result.data) {
        setCurrencies(result.data);
      } else {
        throw new Error(result?.error || t.payment.errors.getCurrencies);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.payment.errors.getCurrencies);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Create a new payment
  const createPayment = useCallback(
    async (data: CreatePaymentRequest): Promise<CreatePaymentResponse | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.electronAPI?.payment.create(data);
        if (result?.success && result.data) {
          return result.data;
        } else {
          throw new Error(result?.error || t.payment.errors.createPayment);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t.payment.errors.createPayment);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  // Get payment status
  const getPaymentStatus = useCallback(
    async (paymentId: string): Promise<PaymentStatusResponse | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.electronAPI?.payment.getStatus(paymentId);
        if (result?.success && result.data) {
          return result.data;
        } else {
          throw new Error(result?.error || t.payment.errors.getStatus);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t.payment.errors.getStatus);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  // Get payment history
  const getPaymentHistory = useCallback(async (): Promise<PaymentHistory[]> => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.electronAPI?.payment.getHistory();
      if (result?.success && result.data) {
        return result.data;
      } else {
        throw new Error(result?.error || t.payment.errors.getHistory);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.payment.errors.getHistory);
      return [];
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Get current credits
  const getCredits = useCallback(async (): Promise<number | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.electronAPI?.payment.getCredits();
      if (result?.success && result.credits !== undefined) {
        return result.credits;
      } else {
        throw new Error(result?.error || t.payment.errors.getCredits);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.payment.errors.getCredits);
      return null;
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load plans on mount
  useEffect(() => {
    getPlans();
    getCurrencies();
  }, [getPlans, getCurrencies]);

  return {
    plans,
    currencies,
    loading,
    error,
    getPlans,
    getCurrencies,
    createPayment,
    getPaymentStatus,
    getPaymentHistory,
    getCredits,
  };
}
