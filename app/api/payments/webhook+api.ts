import {
  handleWebhook,
  WebhookVerificationError,
  type WebhookCallbacks,
} from '@take-out/payments/server'
import { STRIPE_WEBHOOK_SECRET } from '~/server/env-server'
import { ensureStripeInit } from './_init'

// stub callbacks — replace with real db operations when you add payment tables
const webhookCallbacks: WebhookCallbacks = {
  isEventProcessed: async (_eventId) => {
    // TODO: check payment_events table
    return false
  },

  markEventProcessed: async (_eventId, _type) => {
    // TODO: insert into payment_events table
  },

  onCheckoutCompleted: async (session) => {
    console.info('[payments] checkout completed:', session.id, session.metadata)
  },

  onSubscriptionCreated: async (subscription) => {
    console.info('[payments] subscription created:', subscription.id)
  },

  onSubscriptionUpdated: async (subscription) => {
    console.info('[payments] subscription updated:', subscription.id, subscription.status)
  },

  onSubscriptionDeleted: async (subscription) => {
    console.info('[payments] subscription deleted:', subscription.id)
  },

  onInvoicePaymentSucceeded: async (invoice) => {
    console.info('[payments] invoice paid:', invoice.id)
  },

  onInvoicePaymentFailed: async (invoice) => {
    console.info('[payments] invoice payment failed:', invoice.id)
  },
}

export async function POST(req: Request): Promise<Response> {
  ensureStripeInit()

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return Response.json({ error: 'missing stripe-signature header' }, { status: 400 })
  }

  const body = await req.text()

  try {
    const result = await handleWebhook(body, signature, {
      webhookSecret: STRIPE_WEBHOOK_SECRET,
      callbacks: webhookCallbacks,
    })

    return Response.json(result)
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return Response.json({ error: err.message }, { status: 400 })
    }

    console.info('[payments] webhook error:', err)
    return Response.json({ error: 'webhook processing failed' }, { status: 500 })
  }
}
