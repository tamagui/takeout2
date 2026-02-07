import type Stripe from 'stripe'
import { getStripeClient } from './client'
import type { SubscriptionStatus } from '../types'

export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient()
  return stripe.subscriptions.retrieve(subscriptionId)
}

export async function listCustomerSubscriptions(
  customerId: string,
  status?: SubscriptionStatus
): Promise<Stripe.Subscription[]> {
  const stripe = getStripeClient()
  const params: Stripe.SubscriptionListParams = {
    customer: customerId,
    limit: 10,
  }
  if (status) {
    params.status = status
  }
  const result = await stripe.subscriptions.list(params)
  return result.data
}

// cancel at end of current billing period (graceful)
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient()
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

// cancel immediately
export async function cancelSubscriptionImmediately(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient()
  return stripe.subscriptions.cancel(subscriptionId)
}

// reactivate a subscription that was set to cancel at period end
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient()
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

// change subscription plan (upgrade/downgrade)
export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPriceId: string,
  options?: { prorationBehavior?: Stripe.SubscriptionUpdateParams.ProrationBehavior }
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient()

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const currentItem = subscription.items.data[0]

  if (!currentItem) {
    throw new Error('subscription has no items')
  }

  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: currentItem.id,
        price: newPriceId,
      },
    ],
    proration_behavior: options?.prorationBehavior ?? 'always_invoice',
  })
}

export interface ExtractedSubscriptionInfo {
  id: string
  status: SubscriptionStatus
  customerId: string
  priceId: string | null
  productId: string | null
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  canceledAt: Date | null
}

// helper to extract useful subscription info
export function extractSubscriptionInfo(sub: Stripe.Subscription): ExtractedSubscriptionInfo {
  const firstItem = sub.items.data[0]

  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

  let priceId: string | null = null
  let productId: string | null = null

  if (firstItem) {
    priceId = firstItem.price.id
    const product = firstItem.price.product
    productId = typeof product === 'string' ? product : product?.id ?? null
  }

  return {
    id: sub.id,
    status: sub.status as SubscriptionStatus,
    customerId,
    priceId,
    productId,
    // stripe v20+ moved period to subscription items
    currentPeriodStart: firstItem
      ? new Date(firstItem.current_period_start * 1000)
      : null,
    currentPeriodEnd: firstItem
      ? new Date(firstItem.current_period_end * 1000)
      : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
  }
}
