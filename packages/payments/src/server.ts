// server-only exports — stripe sdk + webhook handling

// stripe client
export { createStripeClient, getStripeClient, type StripeClientOptions } from './stripe/client'

// checkout sessions + direct subscriptions
export {
  createCheckoutSession,
  createPortalSession,
  getCheckoutSession,
  createDirectSubscription,
  type CreateSubscriptionResult,
} from './stripe/checkout'

// customer management
export {
  getOrCreateCustomer,
  updateCustomer,
  deleteCustomer,
  type GetOrCreateCustomerParams,
} from './stripe/customers'

// subscription management
export {
  getSubscription,
  listCustomerSubscriptions,
  cancelSubscription,
  cancelSubscriptionImmediately,
  reactivateSubscription,
  changeSubscriptionPlan,
  extractSubscriptionInfo,
  type ExtractedSubscriptionInfo,
} from './stripe/subscriptions'

// prices and products
export { listPrices, getPrice, listProducts, getProduct } from './stripe/prices'

// payment intents (for custom Elements flow)
export {
  createPaymentIntent,
  confirmPaymentIntent,
  getPaymentIntent,
  type CreatePaymentIntentParams,
} from './stripe/intents'

// webhook handling
export {
  handleWebhook,
  WebhookVerificationError,
  type WebhookHandlerOptions,
  type WebhookResult,
} from './webhooks/handler'

// idempotency
export { createStableIdempotencyKey } from './stripe/idempotency'

// error handling
export { parseStripeError, type PaymentError } from './stripe/errors'

// re-export all types (client + server)
export type * from './types'
export type { WebhookCallbacks } from './types.server'
