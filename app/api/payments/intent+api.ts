import {
  createPaymentIntent,
  getPaymentIntent,
  getPrice,
} from '@take-out/payments/server'
import { ensureAuth } from '~/features/auth/server/ensureAuth'
import { ensureStripeInit } from './_init'

// POST /api/payments/intent — create a payment intent from a price id (server-side amount lookup)
export async function POST(req: Request): Promise<Response> {
  await ensureAuth(req)
  ensureStripeInit()

  const body = (await req.json()) as { priceId?: string }

  if (!body.priceId) {
    return Response.json({ error: 'priceId is required' }, { status: 400 })
  }

  const price = await getPrice(body.priceId)

  if (!price.unit_amount || price.unit_amount <= 0) {
    return Response.json({ error: 'price has no valid amount' }, { status: 400 })
  }

  const intent = await createPaymentIntent({
    amount: price.unit_amount,
    currency: price.currency,
  })

  return Response.json({
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  })
}

// GET /api/payments/intent?id=pi_xxx — retrieve a payment intent status
export async function GET(req: Request): Promise<Response> {
  await ensureAuth(req)
  ensureStripeInit()

  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  if (!id) {
    return Response.json({ error: 'id query param is required' }, { status: 400 })
  }

  const intent = await getPaymentIntent(id)

  return Response.json({
    id: intent.id,
    status: intent.status,
    amount: intent.amount,
    currency: intent.currency,
  })
}
