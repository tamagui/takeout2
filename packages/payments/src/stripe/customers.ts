import type Stripe from 'stripe'
import { getStripeClient } from './client'

export interface GetOrCreateCustomerParams {
  userId: string
  email: string
  name?: string
  metadata?: Record<string, string>
}

// look up or create a stripe customer, linking them to a userId via metadata
export async function getOrCreateCustomer(
  params: GetOrCreateCustomerParams,
  options?: {
    findExisting?: (userId: string) => Promise<string | null>
    saveCustomer?: (userId: string, customerId: string) => Promise<void>
  }
): Promise<Stripe.Customer> {
  const stripe = getStripeClient()
  const { userId, email, name, metadata } = params

  // check local db first if callback provided
  if (options?.findExisting) {
    const existingId = await options.findExisting(userId)
    if (existingId) {
      const customer = await stripe.customers.retrieve(existingId)
      if (!customer.deleted) {
        return customer as Stripe.Customer
      }
    }
  }

  // search stripe by email as fallback
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length > 0) {
    const customer = existing.data[0]
    if (options?.saveCustomer) {
      await options.saveCustomer(userId, customer.id)
    }
    return customer
  }

  // create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
      ...metadata,
    },
  })

  if (options?.saveCustomer) {
    await options.saveCustomer(userId, customer.id)
  }

  return customer
}

export async function updateCustomer(
  customerId: string,
  params: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
  const stripe = getStripeClient()
  return stripe.customers.update(customerId, params)
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const stripe = getStripeClient()
  await stripe.customers.del(customerId)
}
