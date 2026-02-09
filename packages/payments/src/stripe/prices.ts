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

// re-export for server consumers
export { formatPrice } from '../utils/formatPrice'
