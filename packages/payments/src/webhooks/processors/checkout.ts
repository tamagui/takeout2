import type Stripe from 'stripe'
import type { WebhookCallbacks } from '../../types.server'

export async function processCheckoutCompleted(
  session: Stripe.Checkout.Session,
  callbacks: WebhookCallbacks
): Promise<void> {
  // only process completed sessions
  if (session.status !== 'complete') return

  await callbacks.onCheckoutCompleted(session)
}
