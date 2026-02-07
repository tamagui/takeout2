import type Stripe from 'stripe'
import type { WebhookCallbacks } from '../../types'

export type SubscriptionEventType = 'created' | 'updated' | 'deleted'

export async function processSubscriptionEvent(
  eventType: SubscriptionEventType,
  subscription: Stripe.Subscription,
  callbacks: WebhookCallbacks
): Promise<void> {
  switch (eventType) {
    case 'created':
      await callbacks.onSubscriptionCreated(subscription)
      break
    case 'updated':
      await callbacks.onSubscriptionUpdated(subscription)
      break
    case 'deleted':
      await callbacks.onSubscriptionDeleted(subscription)
      break
  }
}
