import type Stripe from 'stripe'
import { getStripeClient } from './client'
import { createStableIdempotencyKey } from './idempotency'

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

  return stripe.paymentIntents.create(
    {
      amount: params.amount,
      currency: params.currency,
      customer: params.customerId,
      metadata: params.metadata,
      payment_method_types: ['card'],
      setup_future_usage: params.setupFutureUsage,
    },
    params.customerId
      ? {
          idempotencyKey: createStableIdempotencyKey(
            params.customerId,
            'pi',
            String(params.amount)
          ),
        }
      : undefined
  )
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
