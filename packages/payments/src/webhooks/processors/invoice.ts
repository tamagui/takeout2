import type Stripe from 'stripe'
import type { WebhookCallbacks } from '../../types.server'

export type InvoiceEventType = 'succeeded' | 'failed'

export async function processInvoiceEvent(
  eventType: InvoiceEventType,
  invoice: Stripe.Invoice,
  callbacks: WebhookCallbacks
): Promise<void> {
  switch (eventType) {
    case 'succeeded':
      await callbacks.onInvoicePaymentSucceeded(invoice)
      break
    case 'failed':
      await callbacks.onInvoicePaymentFailed(invoice)
      break
  }
}
