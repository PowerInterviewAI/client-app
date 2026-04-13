/**
 * PaymentService
 * Manages payment and credit operations
 */

import { PaymentApi } from '../api/payment.js';
import {
  AvailableCurrency,
  CreatePaymentRequest,
  CreatePaymentResponse,
  CreditPlan,
  CreditPlanInfo,
  PaymentHistory,
  PaymentStatusResponse,
} from '../types/payment.js';
import { appStateService } from './app-state.service.js';

// Default credit plans
const DEFAULT_CREDIT_PLANS: CreditPlanInfo[] = [
  {
    plan: CreditPlan.Starter,
    credits: 600,
    priceUsd: 20,
    description: 'Starter Pack - Perfect for trying out',
  },
  {
    plan: CreditPlan.Pro,
    credits: 6000,
    priceUsd: 100,
    popular: true,
    description: 'Popular Choice - Best value for regular users',
  },
  {
    plan: CreditPlan.Enterprise,
    credits: 60000,
    priceUsd: 500,
    description: 'Pro Pack - For power users',
  },
];

export class PaymentService {
  private api: PaymentApi;

  constructor() {
    this.api = new PaymentApi();
  }

  /**
   * Get available credit plans
   */
  async getPlans(): Promise<{ success: boolean; data?: CreditPlanInfo[]; error?: string }> {
    try {
      const response = await this.api.getPlans();

      if (response.error) {
        console.error('[PaymentService] Failed to get plans:', response.error);
        // Return default plans on error
        return { success: true, data: DEFAULT_CREDIT_PLANS };
      }

      // Map backend plans to frontend format
      const plans: CreditPlanInfo[] =
        response.data?.map((plan) => {
          const defaultPlan = DEFAULT_CREDIT_PLANS.find((p) => p.plan === plan.plan);
          return {
            plan: plan.plan,
            credits: plan.credits,
            priceUsd: plan.price_usd,
            popular: defaultPlan?.popular,
            description: defaultPlan?.description,
          };
        }) || [];

      return { success: true, data: plans };
    } catch (error) {
      console.error('[PaymentService] Failed to get plans:', error);
      return { success: true, data: DEFAULT_CREDIT_PLANS };
    }
  }

  /**
   * Get available payment currencies
   */
  async getAvailableCurrencies(): Promise<{
    success: boolean;
    data?: AvailableCurrency[];
    error?: string;
  }> {
    try {
      const response = await this.api.getAvailableCurrencies();
      if (response.error) {
        return {
          success: false,
          error: response.error.message || 'Failed to get available currencies',
        };
      }

      return { success: true, data: response.data || [] };
    } catch (error) {
      console.error('[PaymentService] Failed to get available currencies:', error);
      return { success: false, error: 'Failed to get available currencies' };
    }
  }

  /**
   * Create a new payment
   */
  async createPayment(
    data: CreatePaymentRequest
  ): Promise<{ success: boolean; data?: CreatePaymentResponse; error?: string }> {
    try {
      const response = await this.api.createPayment(data);

      if (response.error) {
        return { success: false, error: response.error.message || 'Failed to create payment' };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('[PaymentService] Failed to create payment:', error);
      return { success: false, error: 'Failed to create payment' };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    paymentId: string
  ): Promise<{ success: boolean; data?: PaymentStatusResponse; error?: string }> {
    try {
      const response = await this.api.getPaymentStatus(paymentId);

      if (response.error) {
        return { success: false, error: response.error.message || 'Failed to get payment status' };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('[PaymentService] Failed to get payment status:', error);
      return { success: false, error: 'Failed to get payment status' };
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<{
    success: boolean;
    data?: PaymentHistory[];
    error?: string;
  }> {
    try {
      const response = await this.api.getPaymentHistory();

      if (response.error) {
        return { success: false, error: response.error.message || 'Failed to get payment history' };
      }

      return { success: true, data: response.data || [] };
    } catch (error) {
      console.error('[PaymentService] Failed to get payment history:', error);
      return { success: false, error: 'Failed to get payment history' };
    }
  }

  /**
   * Get current user credits
   */
  async getCredits(): Promise<{ success: boolean; credits?: number; error?: string }> {
    try {
      const response = await this.api.getCredits();

      if (response.error) {
        return { success: false, error: response.error.message || 'Failed to get credits' };
      }

      // Update app state with latest credits
      if (response.data?.credits !== undefined) {
        appStateService.updateState({ credits: response.data.credits });
      }

      return { success: true, credits: response.data?.credits || 0 };
    } catch (error) {
      console.error('[PaymentService] Failed to get credits:', error);
      return { success: false, error: 'Failed to get credits' };
    }
  }

  /**
   * Poll payment status until it's completed or failed
   */
  async pollPaymentStatus(
    paymentId: string,
    onUpdate?: (status: PaymentStatusResponse) => void,
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<{ success: boolean; data?: PaymentStatusResponse; error?: string }> {
    let attempts = 0;

    const poll = async (): Promise<{
      success: boolean;
      data?: PaymentStatusResponse;
      error?: string;
    }> => {
      if (attempts >= maxAttempts) {
        return { success: false, error: 'Payment polling timeout' };
      }

      attempts++;
      const result = await this.getPaymentStatus(paymentId);

      if (!result.success || !result.data) {
        return result;
      }

      onUpdate?.(result.data);

      // Check if payment is in a final state
      const finalStates = ['finished', 'failed', 'refunded', 'expired'];
      if (finalStates.includes(result.data.payment_status)) {
        // Refresh credits if payment is finished
        if (result.data.payment_status === 'finished') {
          await this.getCredits();
        }
        return result;
      }

      // Continue polling
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      return poll();
    };

    return poll();
  }
}

export const paymentService = new PaymentService();
