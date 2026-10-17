/**
 * PaymentService
 * Manages payment and credit operations
 */

import { PaymentApi } from '../api/payment.js';
import {
  AvailableCurrency,
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentHistory,
  PaymentStatusResponse,
  SubscriptionPlanInfo,
} from '../types/payment.js';
import { uiStrings } from '../utils/ui-strings.js';

export class PaymentService {
  private api: PaymentApi;

  constructor() {
    this.api = new PaymentApi();
  }

  /**
   * Get the subscription passes on sale.
   *
   * Pricing is never synthesized locally: a stale hardcoded plan would quote the user one price
   * and charge another. Failures surface as errors so the UI can say so.
   */
  async getPlans(): Promise<{ success: boolean; data?: SubscriptionPlanInfo[]; error?: string }> {
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
      const plans: SubscriptionPlanInfo[] =
        response.data?.map((plan) => ({
          plan: plan.plan,
          priceUsd: plan.price_usd,
          days: plan.days,
          pricePerMonthUsd: plan.price_per_month_usd,
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
}

export const paymentService = new PaymentService();
