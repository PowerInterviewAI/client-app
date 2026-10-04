/**
 * PaymentService
 * Manages payment and credit operations
 */

import { PaymentApi } from '../api/payment.js';
import {
  AvailableCurrency,
  CreatePaymentRequest,
  CreatePaymentResponse,
  CreditPlanInfo,
  PaymentHistory,
  PaymentStatusResponse,
} from '../types/payment.js';
import { uiStrings } from '../utils/ui-strings.js';
import { appStateService } from './app-state.service.js';

export class PaymentService {
  private api: PaymentApi;

  constructor() {
    this.api = new PaymentApi();
  }

  /**
   * Get available credit plans.
   *
   * Pricing is never synthesized locally: a stale hardcoded plan would quote the user one price
   * and charge another. Failures surface as errors so the UI can say so.
   */
  async getPlans(): Promise<{ success: boolean; data?: CreditPlanInfo[]; error?: string }> {
    try {
      const response = await this.api.getPlans();

      if (response.error) {
        console.error('[PaymentService] Failed to get plans:', response.error);
        return {
          success: false,
          error: response.error.message || uiStrings().paymentErrors.getPlans,
        };
      }

      // Map backend plans to frontend format
      const plans: CreditPlanInfo[] =
        response.data?.map((plan) => ({
          plan: plan.plan,
          credits: plan.credits,
          priceUsd: plan.price_usd,
          popular: plan.popular,
        })) || [];

      return { success: true, data: plans };
    } catch (error) {
      console.error('[PaymentService] Failed to get plans:', error);
      return { success: false, error: uiStrings().paymentErrors.getPlans };
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
          error: response.error.message || uiStrings().paymentErrors.getCurrencies,
        };
      }

      return { success: true, data: response.data || [] };
    } catch (error) {
      console.error('[PaymentService] Failed to get available currencies:', error);
      return { success: false, error: uiStrings().paymentErrors.getCurrencies };
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
        return {
          success: false,
          error: response.error.message || uiStrings().paymentErrors.createPayment,
        };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('[PaymentService] Failed to create payment:', error);
      return { success: false, error: uiStrings().paymentErrors.createPayment };
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
        return {
          success: false,
          error: response.error.message || uiStrings().paymentErrors.getStatus,
        };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('[PaymentService] Failed to get payment status:', error);
      return { success: false, error: uiStrings().paymentErrors.getStatus };
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
        return {
          success: false,
          error: response.error.message || uiStrings().paymentErrors.getHistory,
        };
      }

      return { success: true, data: response.data || [] };
    } catch (error) {
      console.error('[PaymentService] Failed to get payment history:', error);
      return { success: false, error: uiStrings().paymentErrors.getHistory };
    }
  }

  /**
   * Get current user credits
   */
  async getCredits(): Promise<{ success: boolean; credits?: number; error?: string }> {
    try {
      const response = await this.api.getCredits();

      if (response.error) {
        return {
          success: false,
          error: response.error.message || uiStrings().paymentErrors.getCredits,
        };
      }

      // Update app state with latest credits
      if (response.data?.credits !== undefined) {
        appStateService.updateState({ credits: response.data.credits });
      }

      return { success: true, credits: response.data?.credits || 0 };
    } catch (error) {
      console.error('[PaymentService] Failed to get credits:', error);
      return { success: false, error: uiStrings().paymentErrors.getCredits };
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
        return { success: false, error: uiStrings().paymentErrors.pollingTimeout };
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
