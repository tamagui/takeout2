import { getStripeClient } from './client'
import { createStableIdempotencyKey } from './idempotency'

import type { CreateCheckoutParams, CreatePortalParams } from '../types'
import type Stripe from 'stripe'

// create a stripe checkout session (hosted page — works for both web and native via browser)
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient()

  const {
    userId,
    email,
    priceId,
    items,
    mode = 'payment',
    successUrl,
    cancelUrl,
    metadata,
    trialPeriodDays,
    allowPromotionCodes = false,
    customerId,
  } = params

  // build line_items from items array or single priceId
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items?.length
    ? items.map((item) => ({ price: item.priceId, quantity: item.quantity }))
    : priceId
      ? [{ price: priceId, quantity: 1 }]
      : []

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode,
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: allowPromotionCodes,
    metadata: {
      userId,
      ...metadata,
    },
    line_items: lineItems,
  }

  // use existing customer if available, otherwise set email for new customer creation
  if (customerId) {
    sessionParams.customer = customerId
  } else {
    sessionParams.customer_email = email
  }

  // subscription-specific options
  if (mode === 'subscription') {
    sessionParams.subscription_data = {
      metadata: { userId },
      ...(trialPeriodDays ? { trial_period_days: trialPeriodDays } : {}),
    }
  }

  // one-time payment options
  if (mode === 'payment') {
    sessionParams.payment_intent_data = {
      metadata: { userId },
    }
  }

  return stripe.checkout.sessions.create(sessionParams)
}

// result from creating a subscription directly (not via checkout)
export interface CreateSubscriptionResult {
  subscription: Stripe.Subscription
  status: 'active' | 'requires_action' | 'incomplete'
  clientSecret: string | null
}

// create a subscription directly with 3DS support
// use this when you have a payment method already (e.g. from native PaymentSheet)
export async function createDirectSubscription(
  customerId: string,
  priceId: string,
  options?: {
    paymentMethodId?: string
    metadata?: Record<string, string>
    trialPeriodDays?: number
  }
): Promise<CreateSubscriptionResult> {
  const stripe = getStripeClient()

  const params: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.confirmation_secret', 'latest_invoice.payments'],
    metadata: options?.metadata,
  }

  if (options?.paymentMethodId) {
    params.default_payment_method = options.paymentMethodId
  }

  if (options?.trialPeriodDays) {
    params.trial_period_days = options.trialPeriodDays
  }

  const subscription = await stripe.subscriptions.create(params, {
    idempotencyKey: createStableIdempotencyKey(customerId, 'subscribe', priceId),
  })

  const invoice = subscription.latest_invoice as Stripe.Invoice | null

  // stripe v20: client_secret is on invoice.confirmation_secret
  const clientSecret = invoice?.confirmation_secret?.client_secret ?? null

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    return { subscription, status: 'active', clientSecret: null }
  }

  // 3DS or incomplete: return client secret so frontend can complete authentication
  if (clientSecret) {
    return {
      subscription,
      status: 'requires_action',
      clientSecret,
    }
  }

  return {
    subscription,
    status: 'incomplete',
    clientSecret: null,
  }
}

// create a customer portal session for managing subscriptions
export async function createPortalSession(
  params: CreatePortalParams
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripeClient()

  return stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  })
}

// retrieve a checkout session (useful for verifying after redirect)
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient()
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'customer'],
  })
}
