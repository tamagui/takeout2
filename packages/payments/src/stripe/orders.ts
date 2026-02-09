import type Stripe from 'stripe'
import { getStripeClient } from './client'
import { getPrice } from './prices'

import type { CreateOrderParams, CreateOrderResult } from '../types'

interface ResolvedItem {
  price: Stripe.Price
  quantity: number
  isRecurring: boolean
}

// create a multi-item order using the invoice + subscription pattern
// one-time items → invoice items + invoice (paid immediately)
// recurring items → subscription (with coupon if provided)
export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const stripe = getStripeClient()
  const { customerId, paymentMethodId, items, couponId, metadata } = params

  // attach payment method and set as default (ignore if already attached)
  try {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
  } catch (err: any) {
    if (err?.code !== 'resource_already_exists') throw err
  }
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  })

  // resolve all prices from stripe (server-side amount lookup)
  const resolved = await resolveItems(items)
  const oneTimeItems = resolved.filter((r) => !r.isRecurring)
  const recurringItems = resolved.filter((r) => r.isRecurring)

  let invoiceId: string | null = null
  const subscriptionIds: string[] = []
  let status: CreateOrderResult['status'] = 'succeeded'
  let clientSecret: string | null = null

  // one-time items → create invoice items, then a single invoice
  if (oneTimeItems.length > 0) {
    const invoiceResult = await createOneTimeInvoice(
      stripe,
      customerId,
      oneTimeItems,
      couponId,
      metadata
    )
    invoiceId = invoiceResult.invoiceId

    if (invoiceResult.status === 'requires_action') {
      status = 'requires_action'
      clientSecret = invoiceResult.clientSecret
    }
  }

  // recurring items → group by billing interval, create one subscription per group
  // (stripe doesn't allow mixing different intervals in a single subscription)
  if (recurringItems.length > 0) {
    const byInterval = new Map<string, ResolvedItem[]>()
    for (const item of recurringItems) {
      const interval = item.price.recurring?.interval ?? 'month'
      const group = byInterval.get(interval) ?? []
      group.push(item)
      byInterval.set(interval, group)
    }

    for (const [, groupItems] of byInterval) {
      const subResult = await createRecurringSubscription(
        stripe,
        customerId,
        groupItems,
        couponId,
        metadata
      )
      subscriptionIds.push(subResult.subscriptionId)

      if (subResult.status === 'requires_action' && !clientSecret) {
        status = 'requires_action'
        clientSecret = subResult.clientSecret
      }

      if (subResult.status === 'incomplete') {
        status = 'incomplete'
      }
    }
  }

  return { invoiceId, subscriptionIds, status, clientSecret }
}

async function resolveItems(items: CreateOrderParams['items']): Promise<ResolvedItem[]> {
  const resolved = await Promise.all(
    items.map(async (item) => {
      const price = await getPrice(item.priceId)
      return {
        price,
        quantity: item.quantity,
        isRecurring: !!price.recurring,
      }
    })
  )
  return resolved
}

async function createOneTimeInvoice(
  stripe: Stripe,
  customerId: string,
  items: ResolvedItem[],
  couponId?: string,
  metadata?: Record<string, string>
): Promise<{ invoiceId: string; status: 'succeeded' | 'requires_action'; clientSecret: string | null }> {
  // create invoice items in parallel (they attach to the customer's next invoice)
  await Promise.all(
    items.map((item) =>
      stripe.invoiceItems.create({
        customer: customerId,
        pricing: { price: item.price.id },
        quantity: item.quantity,
        metadata,
      })
    )
  )

  let invoice: Stripe.Invoice
  try {
    // create the invoice with optional coupon discount
    invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: false,
      metadata,
      ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
    })
  } catch (err) {
    // clean up orphaned invoice items — they'd otherwise appear on the customer's next invoice
    const pending = await stripe.invoiceItems.list({ customer: customerId, pending: true })
    await Promise.all(pending.data.map((ii) => stripe.invoiceItems.del(ii.id).catch(() => {})))
    throw err
  }

  // finalize — stripe may auto-collect if customer has a default payment method
  const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
    expand: ['confirmation_secret'],
  })

  // only call pay() if not already paid (auto-collection may have already charged)
  const paidInvoice =
    finalizedInvoice.status === 'paid'
      ? finalizedInvoice
      : await stripe.invoices.pay(finalizedInvoice.id, {
          expand: ['confirmation_secret'],
        })

  // stripe v20: client_secret is on invoice.confirmation_secret
  const clientSecret = paidInvoice.confirmation_secret?.client_secret ?? null

  if (paidInvoice.status === 'paid') {
    return { invoiceId: paidInvoice.id, status: 'succeeded', clientSecret: null }
  }

  if (clientSecret) {
    return {
      invoiceId: paidInvoice.id,
      status: 'requires_action',
      clientSecret,
    }
  }

  // invoice not paid and no client secret for 3DS — something went wrong
  throw new Error(`invoice ${paidInvoice.id} not paid (status: ${paidInvoice.status})`)
}

async function createRecurringSubscription(
  stripe: Stripe,
  customerId: string,
  items: ResolvedItem[],
  couponId?: string,
  metadata?: Record<string, string>
): Promise<{ subscriptionId: string; status: 'succeeded' | 'requires_action' | 'incomplete'; clientSecret: string | null }> {
  const subscriptionItems: Stripe.SubscriptionCreateParams.Item[] = items.map((item) => ({
    price: item.price.id,
    quantity: item.quantity,
  }))

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: subscriptionItems,
    payment_behavior: 'allow_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.confirmation_secret'],
    metadata,
    ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
  })

  const invoice = subscription.latest_invoice as Stripe.Invoice | null

  // stripe v20: client_secret is on invoice.confirmation_secret
  const clientSecret = invoice?.confirmation_secret?.client_secret ?? null

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    return { subscriptionId: subscription.id, status: 'succeeded', clientSecret: null }
  }

  if (clientSecret) {
    return {
      subscriptionId: subscription.id,
      status: 'requires_action',
      clientSecret,
    }
  }

  return { subscriptionId: subscription.id, status: 'incomplete', clientSecret: null }
}

// rollback a failed order — refund invoice and cancel subscriptions
export async function rollbackOrder(
  invoiceId: string | null,
  subscriptionIds: string[]
): Promise<void> {
  const stripe = getStripeClient()

  for (const subId of subscriptionIds) {
    try {
      await stripe.subscriptions.cancel(subId)
    } catch {
      // best-effort rollback
    }
  }

  if (invoiceId) {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId, {
        expand: ['payments.data.payment.charge'],
      })
      const charge = invoice.payments?.data?.[0]?.payment?.charge
      const chargeId = typeof charge === 'string' ? charge : charge?.id
      if (chargeId) {
        await stripe.refunds.create({ charge: chargeId })
      }
    } catch {
      // best-effort rollback
    }
  }
}
