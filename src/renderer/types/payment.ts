/**
 * Payment Types (Renderer Process)
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

/**
 * What a payment buys. Monthly and yearly are the subscription passes on sale; the credit packs
 * are only here because orders placed before subscriptions carry them.
 */
export enum PaymentPlan {
  Monthly = 'monthly',
  Yearly = 'yearly',
  Starter = 'starter',
  Pro = 'pro',
  Enterprise = 'enterprise',
}

/** A subscription pass, from `GET /api/payment/subscription-plans`. */
export interface SubscriptionPlanInfo {
  plan: PaymentPlan;
  priceUsd: number;
  /** How many days of subscription the pass adds. */
  days: number;
  /** The price per month, for display: $96 for a year is $8 a month. */
  pricePerMonthUsd: number;
  popular: boolean;
}

export interface CreatePaymentRequest {
  plan: PaymentPlan;
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
  plan: PaymentPlan;
  credits_amount: number;
  /** Absent from a backend that predates subscriptions. */
  days_amount?: number;
  /** What the order actually granted once applied, overpay bonus included. */
  days_granted?: number | null;
  price_amount: number;
  pay_address: string | null;
  pay_amount: number | null;
  pay_currency: string | null;
  status: PaymentStatus;
  credits_applied: boolean;
  created_at: string;
  updated_at: string;
}
