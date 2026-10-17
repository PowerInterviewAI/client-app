/**
 * Payment API
 * Handles payment and credit operations
 */

import {
  AvailableCurrency,
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentHistory,
  PaymentPlan,
  PaymentStatusResponse,
} from '../types/payment.js';
import { ApiClient, ApiResponse } from './client.js';

export class PaymentApi extends ApiClient {
  /**
   * Get the subscription passes on sale.
   */
  async getPlans(): Promise<
    ApiResponse<
      {
        plan: PaymentPlan;
        price_usd: number;
        days: number;
        price_per_month_usd: number;
        popular: boolean;
      }[]
    >
  > {
    return this.get('/api/payment/subscription-plans');
  }

  /**
   * Get available currencies for payment
   */
  async getAvailableCurrencies(): Promise<ApiResponse<AvailableCurrency[]>> {
    return this.get('/api/payment/currencies');
  }

  /**
   * Create a new payment
   */
  async createPayment(data: CreatePaymentRequest): Promise<ApiResponse<CreatePaymentResponse>> {
    return this.post('/api/payment/create', data);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<ApiResponse<PaymentStatusResponse>> {
    return this.get(`/api/payment/status/${paymentId}`);
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<ApiResponse<PaymentHistory[]>> {
    return this.get('/api/payment/history');
  }
}
