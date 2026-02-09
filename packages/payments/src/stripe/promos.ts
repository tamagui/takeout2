import type Stripe from 'stripe'
import { getStripeClient } from './client'

export interface ValidatedPromo {
  promotionCodeId: string
  couponId: string
  code: string
  percentOff: number | null
  amountOff: number | null
  currency: string | null
}

// look up a promotion code by user-facing code string and validate it's active
export async function validatePromotionCode(code: string): Promise<ValidatedPromo | null> {
  const stripe = getStripeClient()

  const result = await stripe.promotionCodes.list({
    code,
    active: true,
    limit: 1,
    expand: ['data.promotion.coupon'],
  })

  const promo = result.data[0]
  if (!promo) return null

  const coupon = promo.promotion.coupon as Stripe.Coupon | null
  if (!coupon || !coupon.valid) return null

  return {
    promotionCodeId: promo.id,
    couponId: coupon.id,
    code: promo.code,
    percentOff: coupon.percent_off,
    amountOff: coupon.amount_off,
    currency: coupon.currency,
  }
}

// calculate the discounted amount given the original amount and promo
export function calculateDiscountedAmount(
  originalAmount: number,
  promo: ValidatedPromo
): { discountedAmount: number; discountAmount: number } {
  let discountAmount = 0

  if (promo.percentOff) {
    discountAmount = Math.round(originalAmount * (promo.percentOff / 100))
  } else if (promo.amountOff) {
    discountAmount = promo.amountOff
  }

  const discountedAmount = Math.max(0, originalAmount - discountAmount)
  return { discountedAmount, discountAmount }
}

// update a payment intent's amount (e.g. after applying a promo code)
export async function updatePaymentIntentAmount(
  paymentIntentId: string,
  amount: number,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient()
  return stripe.paymentIntents.update(paymentIntentId, {
    amount,
    ...(metadata ? { metadata } : {}),
  })
}
