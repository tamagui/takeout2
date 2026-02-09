// server-only types — depends on stripe sdk
import type Stripe from 'stripe'

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
