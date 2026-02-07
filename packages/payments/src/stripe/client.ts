import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export interface StripeClientOptions {
  secretKey: string
  apiVersion?: Stripe.LatestApiVersion
}

export function createStripeClient(options: StripeClientOptions): Stripe {
  const { secretKey, apiVersion } = options

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required')
  }

  stripeInstance = new Stripe(secretKey, {
    ...(apiVersion ? { apiVersion } : {}),
    typescript: true,
  })

  return stripeInstance
}

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    throw new Error('stripe client not initialized — call createStripeClient() first')
  }
  return stripeInstance
}
