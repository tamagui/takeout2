import {
  validatePromotionCode,
  calculateDiscountedAmount,
  updatePaymentIntentAmount,
  getPaymentIntent,
} from '@take-out/payments/server'
import { ensureAuth } from '~/features/auth/server/ensureAuth'
import { ensureStripeInit } from './_init'

// POST /api/payments/promo — validate a promo code and apply to a payment intent
export async function POST(req: Request): Promise<Response> {
  await ensureAuth(req)
  ensureStripeInit()

  const body = (await req.json()) as {
    code?: string
    paymentIntentId?: string
  }

  if (!body.code || !body.paymentIntentId) {
    return Response.json(
      { error: 'code and paymentIntentId are required' },
      { status: 400 }
    )
  }

  const promo = await validatePromotionCode(body.code)

  if (!promo) {
    return Response.json({ error: 'invalid or expired promo code' }, { status: 400 })
  }

  // get the current payment intent to know the original amount
  const intent = await getPaymentIntent(body.paymentIntentId)
  const originalAmount = intent.amount

  // check currency match for fixed-amount coupons
  if (promo.amountOff && promo.currency && promo.currency !== intent.currency) {
    return Response.json(
      { error: 'promo code currency does not match payment currency' },
      { status: 400 }
    )
  }

  const { discountedAmount, discountAmount } = calculateDiscountedAmount(
    originalAmount,
    promo
  )

  // update the payment intent with the discounted amount
  await updatePaymentIntentAmount(body.paymentIntentId, discountedAmount, {
    promotionCodeId: promo.promotionCodeId,
    couponId: promo.couponId,
    promoCode: promo.code,
    originalAmount: String(originalAmount),
  })

  return Response.json({
    valid: true,
    code: promo.code,
    percentOff: promo.percentOff,
    amountOff: promo.amountOff,
    discountAmount,
    discountedAmount,
    currency: intent.currency,
  })
}
