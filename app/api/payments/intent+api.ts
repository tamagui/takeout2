import {
  createStripeClient,
  createPaymentIntent,
  getPaymentIntent,
} from '@take-out/payments/server'
import { ensureAuth } from '~/features/auth/server/ensureAuth'
import { STRIPE_SECRET_KEY } from '~/server/env-server'

let initialized = false

function ensureStripeInit(): void {
  if (!initialized) {
    createStripeClient({ secretKey: STRIPE_SECRET_KEY })
    initialized = true
  }
}

// POST /api/payments/intent — create a payment intent and return the client secret
export async function POST(req: Request): Promise<Response> {
  await ensureAuth(req)
  ensureStripeInit()

  const body = (await req.json()) as { amount?: number; currency?: string }

  if (!body.amount || body.amount <= 0) {
    return Response.json({ error: 'amount is required and must be positive' }, { status: 400 })
  }

  const intent = await createPaymentIntent({
    amount: body.amount,
    currency: body.currency ?? 'usd',
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
