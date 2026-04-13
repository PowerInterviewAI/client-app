/**
 * Payment API
 * Handles payment and credit operations
 */

import {
  AvailableCurrency,
  CreatePaymentRequest,
  CreatePaymentResponse,
  CreditPlan,
  PaymentHistory,
  PaymentStatusResponse,
} from '../types/payment.js';
import { ApiClient, ApiResponse } from './client.js';

export class PaymentApi extends ApiClient {
  /**
   * Get available credit plans
   */
  async getPlans(): Promise<
    ApiResponse<{ plan: CreditPlan; credits: number; price_usd: number; popular: boolean }[]>
  > {
    return this.get('/api/payment/plans');
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

  /**
   * Get current user credits
   */
  async getCredits(): Promise<ApiResponse<{ credits: number }>> {
    return this.get('/api/payment/credits');
  }
}
