/**
 * Payment IPC Handlers
 * Exposes payment functionality to the renderer process
 */

import { ipcMain } from 'electron';

import { paymentService } from '../services/payment.service.js';
import {
  AvailableCurrency,
  CreatePaymentRequest,
  CreatePaymentResponse,
  CreditPlanInfo,
  PaymentHistory,
  PaymentStatusResponse,
} from '../types/payment.js';

export function registerPaymentHandlers(): void {
  /**
   * Get available credit plans
   */
  ipcMain.handle(
    'payment:get-plans',
    async (): Promise<{ success: boolean; data?: CreditPlanInfo[]; error?: string }> => {
      return paymentService.getPlans();
    }
  );

  /**
   * Get available payment currencies
   */
  ipcMain.handle(
    'payment:get-currencies',
    async (): Promise<{ success: boolean; data?: AvailableCurrency[]; error?: string }> => {
      return paymentService.getAvailableCurrencies();
    }
  );

  /**
   * Create a new payment
   */
  ipcMain.handle(
    'payment:create',
    async (
      _event,
      data: CreatePaymentRequest
    ): Promise<{ success: boolean; data?: CreatePaymentResponse; error?: string }> => {
      return paymentService.createPayment(data);
    }
  );

  /**
   * Get payment status
   */
  ipcMain.handle(
    'payment:get-status',
    async (
      _event,
      paymentId: string
    ): Promise<{ success: boolean; data?: PaymentStatusResponse; error?: string }> => {
      return paymentService.getPaymentStatus(paymentId);
    }
  );

  /**
   * Get payment history
   */
  ipcMain.handle(
    'payment:get-history',
    async (): Promise<{ success: boolean; data?: PaymentHistory[]; error?: string }> => {
      return paymentService.getPaymentHistory();
    }
  );

  /**
   * Get current user credits
   */
  ipcMain.handle(
    'payment:get-credits',
    async (): Promise<{ success: boolean; credits?: number; error?: string }> => {
      return paymentService.getCredits();
    }
  );
}
