import type Stripe from 'stripe'
import { getStripeClient } from './client'

export interface CreatePaymentIntentParams {
  amount: number
  currency: string
  customerId?: string
  metadata?: Record<string, string>
  setupFutureUsage?: 'off_session' | 'on_session'
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient()

  return stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency,
    customer: params.customerId,
    metadata: params.metadata,
    automatic_payment_methods: { enabled: true },
    setup_future_usage: params.setupFutureUsage,
  })
}

export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient()

  return stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId,
  })
}

export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient()
  return stripe.paymentIntents.retrieve(paymentIntentId)
}
