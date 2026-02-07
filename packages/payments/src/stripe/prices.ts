import type Stripe from 'stripe'
import { getStripeClient } from './client'

export async function listPrices(
  productId?: string,
  options?: { active?: boolean }
): Promise<Stripe.Price[]> {
  const stripe = getStripeClient()
  const params: Stripe.PriceListParams = {
    limit: 100,
    active: options?.active ?? true,
  }
  if (productId) {
    params.product = productId
  }
  const result = await stripe.prices.list(params)
  return result.data
}

export async function getPrice(priceId: string): Promise<Stripe.Price> {
  const stripe = getStripeClient()
  return stripe.prices.retrieve(priceId, { expand: ['product'] })
}

export async function listProducts(
  options?: { active?: boolean }
): Promise<Stripe.Product[]> {
  const stripe = getStripeClient()
  const result = await stripe.products.list({
    limit: 100,
    active: options?.active ?? true,
  })
  return result.data
}

export async function getProduct(productId: string): Promise<Stripe.Product> {
  const stripe = getStripeClient()
  return stripe.products.retrieve(productId)
}

// format price for display (e.g. "$9.99/mo")
export function formatPrice(
  amount: number,
  currency: string,
  interval?: string | null
): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)

  if (!interval) return formatted

  const intervalMap: Record<string, string> = {
    month: '/mo',
    year: '/yr',
    week: '/wk',
    day: '/day',
  }

  return `${formatted}${intervalMap[interval] ?? `/${interval}`}`
}
