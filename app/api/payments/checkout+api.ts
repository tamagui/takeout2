import {
  createStripeClient,
  createCheckoutSession,
  listProducts,
  listPrices,
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

// POST /api/payments/checkout — create a checkout session and return the url
export async function POST(req: Request): Promise<Response> {
  const session = await ensureAuth(req)
  ensureStripeInit()

  const body = (await req.json()) as { priceId?: string; mode?: string }

  if (!body.priceId) {
    return Response.json({ error: 'priceId is required' }, { status: 400 })
  }

  const origin =
    req.headers.get('origin') || req.headers.get('referer') || 'http://localhost:8081'

  const checkoutSession = await createCheckoutSession({
    userId: session.user.id,
    email: session.user.email,
    priceId: body.priceId,
    mode: (body.mode as 'payment' | 'subscription') || 'payment',
    successUrl: `${origin}/home/products?success=true`,
    cancelUrl: `${origin}/home/products?canceled=true`,
    metadata: {
      source: 'products-page',
    },
  })

  if (!checkoutSession.url) {
    return Response.json({ error: 'failed to create checkout url' }, { status: 500 })
  }

  return Response.json({ url: checkoutSession.url })
}

// GET /api/payments/checkout — list products and prices for the storefront
export async function GET(req: Request): Promise<Response> {
  await ensureAuth(req)
  ensureStripeInit()

  const [products, prices] = await Promise.all([listProducts(), listPrices()])

  const productsWithPrices = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    images: product.images,
    prices: prices
      .filter((price) => price.product === product.id)
      .map((price) => ({
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval ?? 'one_time',
      })),
  }))

  return Response.json({ products: productsWithPrices })
}
