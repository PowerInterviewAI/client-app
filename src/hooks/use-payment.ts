/**
 * Payment hook
 * Provides payment functionality to React components
 */

import { useCallback, useEffect, useState } from 'react';

import type {
  AvailableCurrency,
  CreatePaymentRequest,
  CreatePaymentResponse,
  CreditPlanInfo,
  PaymentHistory,
  PaymentStatusResponse,
} from '@/types/payment';

export function usePayment() {
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
        throw new Error(result?.error || 'Failed to get plans');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get plans');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get available currencies
  const getCurrencies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.electronAPI?.payment.getCurrencies();
      if (result?.success && result.data) {
        setCurrencies(result.data);
      } else {
        throw new Error(result?.error || 'Failed to get currencies');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get currencies');
    } finally {
      setLoading(false);
    }
  }, []);

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
          throw new Error(result?.error || 'Failed to create payment');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create payment');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
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
          throw new Error(result?.error || 'Failed to get payment status');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get payment status');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
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
        throw new Error(result?.error || 'Failed to get payment history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get payment history');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current credits
  const getCredits = useCallback(async (): Promise<number | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.electronAPI?.payment.getCredits();
      if (result?.success && result.credits !== undefined) {
        return result.credits;
      } else {
        throw new Error(result?.error || 'Failed to get credits');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get credits');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

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
