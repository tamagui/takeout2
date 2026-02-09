import type Stripe from 'stripe'
import { getStripeClient } from '../stripe/client'
import type { WebhookCallbacks } from '../types.server'
import { processCheckoutCompleted } from './processors/checkout'
import { processSubscriptionEvent } from './processors/subscription'
import { processInvoiceEvent } from './processors/invoice'

export interface WebhookHandlerOptions {
  webhookSecret: string
  callbacks: WebhookCallbacks
}

export interface WebhookResult {
  received: boolean
  eventId: string
  type: string
  processed: boolean
  error?: string
}

// verify and process a stripe webhook event
// designed to be called from your api route handler
export async function handleWebhook(
  body: string | Buffer,
  signature: string,
  options: WebhookHandlerOptions
): Promise<WebhookResult> {
  const stripe = getStripeClient()
  const { webhookSecret, callbacks } = options

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    throw new WebhookVerificationError(`webhook signature verification failed: ${message}`)
  }

  const result: WebhookResult = {
    received: true,
    eventId: event.id,
    type: event.type,
    processed: false,
  }

  // idempotency — skip already-processed events
  const alreadyProcessed = await callbacks.isEventProcessed(event.id)
  if (alreadyProcessed) {
    result.processed = true
    return result
  }

  try {
    await routeEvent(event, callbacks)
    await callbacks.markEventProcessed(event.id, event.type)
    result.processed = true
  } catch (err) {
    // do not mark as processed — let stripe retry on transient failures
    console.info(`[payments] webhook processing error for ${event.id}:`, err)
    throw err
  }

  return result
}

async function routeEvent(event: Stripe.Event, callbacks: WebhookCallbacks): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await processCheckoutCompleted(session, callbacks)
      break
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription
      await processSubscriptionEvent('created', subscription, callbacks)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await processSubscriptionEvent('updated', subscription, callbacks)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await processSubscriptionEvent('deleted', subscription, callbacks)
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      await processInvoiceEvent('succeeded', invoice, callbacks)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await processInvoiceEvent('failed', invoice, callbacks)
      break
    }

    default:
      // unhandled event type — not an error
      console.info(`[payments] unhandled webhook event: ${event.type}`)
  }
}

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebhookVerificationError'
  }
}
