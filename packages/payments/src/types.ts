import type Stripe from 'stripe'

// subscription status matching stripe's states
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'paused'
  | 'trialing'
  | 'unpaid'

export type CheckoutMode = 'payment' | 'subscription' | 'setup'

export interface Plan {
  id: string
  name: string
  description: string
  stripePriceId: string
  amount: number
  currency: string
  interval: 'month' | 'year' | 'one_time'
  features: string[]
}

export interface SubscriptionRecord {
  id: string
  userId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePriceId: string
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceRecord {
  id: string
  userId: string
  stripeInvoiceId: string
  stripeSubscriptionId: string | null
  amount: number
  currency: string
  status: string
  pdfUrl: string | null
  hostedUrl: string | null
  createdAt: Date
}

export interface StripeCustomerRecord {
  id: string
  userId: string
  stripeCustomerId: string
  createdAt: Date
}

export interface PaymentEventRecord {
  stripeEventId: string
  type: string
  processedAt: Date
}

// params for creating checkout sessions
export interface CreateCheckoutParams {
  userId: string
  email: string
  priceId: string
  mode?: CheckoutMode
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
  trialPeriodDays?: number
  allowPromotionCodes?: boolean
  customerId?: string
}

// params for creating customer portal sessions
export interface CreatePortalParams {
  customerId: string
  returnUrl: string
}

// webhook event types we handle
export type PaymentWebhookEventType =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'

// callback interface for webhook processing — keeps package db-agnostic
export interface WebhookCallbacks {
  isEventProcessed: (eventId: string) => Promise<boolean>
  markEventProcessed: (eventId: string, type: string) => Promise<void>
  onCheckoutCompleted: (session: Stripe.Checkout.Session) => Promise<void>
  onSubscriptionCreated: (subscription: Stripe.Subscription) => Promise<void>
  onSubscriptionUpdated: (subscription: Stripe.Subscription) => Promise<void>
  onSubscriptionDeleted: (subscription: Stripe.Subscription) => Promise<void>
  onInvoicePaymentSucceeded: (invoice: Stripe.Invoice) => Promise<void>
  onInvoicePaymentFailed: (invoice: Stripe.Invoice) => Promise<void>
}

// minimal subscription info for client-side access (synced via zero)
export interface UserSubscriptionInfo {
  plan: string | null
  status: SubscriptionStatus | null
  expiresAt: Date | null
  cancelAtPeriodEnd: boolean
}
