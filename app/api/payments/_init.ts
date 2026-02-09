import { createStripeClient } from '@take-out/payments/server'
import { STRIPE_SECRET_KEY } from '~/server/env-server'

let initialized = false

export function ensureStripeInit(): void {
  if (!initialized) {
    createStripeClient({ secretKey: STRIPE_SECRET_KEY })
    initialized = true
  }
}
