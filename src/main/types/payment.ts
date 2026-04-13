/**
 * Payment Types
 */

export enum PaymentStatus {
  Waiting = 'waiting',
  Confirming = 'confirming',
  Confirmed = 'confirmed',
  Sending = 'sending',
  PartiallyPaid = 'partially_paid',
  Finished = 'finished',
  Failed = 'failed',
  Refunded = 'refunded',
  Expired = 'expired',
}

export enum CreditPlan {
  Starter = 'starter',
  Pro = 'pro',
  Enterprise = 'enterprise',
}

export interface CreditPlanInfo {
  plan: CreditPlan;
  credits: number;
  priceUsd: number;
  popular?: boolean;
  description?: string;
}

export interface CreatePaymentRequest {
  plan: CreditPlan;
  pay_currency?: string;
}

export interface CreatePaymentResponse {
  payment_id: string;
  payment_status: PaymentStatus;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  order_id: string;
  order_description: string;
  payment_url: string;
  created_at: string;
  updated_at: string;
  expiration_estimate_date: string;
}

export interface PaymentStatusResponse {
  payment_id: string;
  order_id: string;
  payment_status: PaymentStatus;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  actually_paid: number | null;
  outcome_amount: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AvailableCurrency {
  code: string;
  name: string;
  logo_url: string;
}

export interface PaymentHistory {
  payment_id: string | null;
  order_id: string;
  plan: CreditPlan;
  credits_amount: number;
  price_amount: number;
  pay_address: string | null;
  pay_amount: number | null;
  pay_currency: string | null;
  status: PaymentStatus;
  credits_applied: boolean;
  created_at: string;
  updated_at: string;
}
