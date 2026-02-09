import {
  createCheckoutSession,
  getOrCreateCustomer,
  listProducts,
  listPrices,
} from '@take-out/payments/server'

import { ensureAuth } from '~/features/auth/server/ensureAuth'

import { ensureStripeInit } from './_init'

// POST /api/payments/checkout — create a checkout session and return the url
export async function POST(req: Request): Promise<Response> {
  const session = await ensureAuth(req)
  ensureStripeInit()

  const body = (await req.json()) as {
    priceId?: string
    items?: Array<{ priceId: string; quantity?: number }>
    mode?: string
  }

  // accept items array or single priceId
  const items = body.items?.length
    ? body.items.map((i) => ({ priceId: i.priceId, quantity: i.quantity ?? 1 }))
    : body.priceId
      ? [{ priceId: body.priceId, quantity: 1 }]
      : []

  if (items.length === 0) {
    return Response.json({ error: 'items or priceId is required' }, { status: 400 })
  }

  // auto-detect mode: fetch prices to check if any are recurring
  let mode = body.mode as 'payment' | 'subscription' | undefined
  if (!mode) {
    const allPrices = await listPrices()
    const priceIds = new Set(items.map((i) => i.priceId))
    const hasRecurring = allPrices.some((p) => priceIds.has(p.id) && p.recurring)
    mode = hasRecurring ? 'subscription' : 'payment'
  }

  // reuse existing stripe customer to avoid duplicates
  const customer = await getOrCreateCustomer({
    userId: session.user.id,
    email: session.user.email,
  })

  const origin =
    req.headers.get('origin') || req.headers.get('referer') || 'http://localhost:8081'

  const checkoutSession = await createCheckoutSession({
    userId: session.user.id,
    email: session.user.email,
    customerId: customer.id,
    items,
    mode,
    successUrl: `${origin}/home/products?success=true`,
    cancelUrl: `${origin}/home/products?canceled=true`,
    allowPromotionCodes: true,
    metadata: {
      source: 'products-page',
    },
  })

  if (!checkoutSession.url) {
    return Response.json({ error: 'failed to create checkout url' }, { status: 500 })
  }

  return Response.json({ url: checkoutSession.url })
}

// products/prices rarely change — cache for 5 minutes to avoid hitting stripe API on every page load
const CATALOG_CACHE_TTL = 5 * 60 * 1000
let catalogCache: { data: unknown; ts: number } | null = null

// GET /api/payments/checkout — list products and prices for the storefront
export async function GET(req: Request): Promise<Response> {
  await ensureAuth(req)
  ensureStripeInit()

  if (catalogCache && Date.now() - catalogCache.ts < CATALOG_CACHE_TTL) {
    return Response.json(catalogCache.data)
  }

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
        type: price.recurring ? ('recurring' as const) : ('one_time' as const),
      })),
  }))

  const responseData = { products: productsWithPrices }
  catalogCache = { data: responseData, ts: Date.now() }

  return Response.json(responseData)
}
