import {
  createOrder,
  getOrCreateCustomer,
  parseStripeError,
  validatePromotionCode,
} from '@take-out/payments/server'

import { ensureAuth } from '~/features/auth/server/ensureAuth'

import { ensureStripeInit } from './_init'

interface OrderRequestBody {
  items?: Array<{ priceId: string; quantity?: number }>
  paymentMethodId?: string
  promoCode?: string
}

// POST /api/payments/order — create a multi-item order (invoice + subscription)
export async function POST(req: Request): Promise<Response> {
  const session = await ensureAuth(req)
  ensureStripeInit()

  const body = (await req.json()) as OrderRequestBody

  if (!body.items || body.items.length === 0) {
    return Response.json({ error: 'items are required' }, { status: 400 })
  }

  if (!body.paymentMethodId) {
    return Response.json({ error: 'paymentMethodId is required' }, { status: 400 })
  }

  // validate promo code if provided
  let couponId: string | undefined
  if (body.promoCode) {
    const promo = await validatePromotionCode(body.promoCode)
    if (!promo) {
      return Response.json({ error: 'invalid or expired promo code' }, { status: 400 })
    }
    couponId = promo.couponId
  }

  // get or create customer
  const customer = await getOrCreateCustomer({
    userId: session.user.id,
    email: session.user.email,
  })

  const items = body.items.map((item) => ({
    priceId: item.priceId,
    quantity: item.quantity ?? 1,
  }))

  try {
    const result = await createOrder({
      customerId: customer.id,
      paymentMethodId: body.paymentMethodId,
      items,
      couponId,
      metadata: {
        userId: session.user.id,
        source: 'products-page',
      },
    })

    return Response.json(result)
  } catch (err) {
    const paymentError = parseStripeError(err)
    return Response.json(
      { error: paymentError.message },
      { status: paymentError.httpStatus }
    )
  }
}
