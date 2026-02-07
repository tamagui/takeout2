// client-safe exports — types, components, hooks, utilities

// types
export type {
  Plan,
  SubscriptionStatus,
  SubscriptionRecord,
  InvoiceRecord,
  StripeCustomerRecord,
  UserSubscriptionInfo,
  CheckoutMode,
  CreateCheckoutParams,
  CreatePortalParams,
  PaymentWebhookEventType,
  WebhookCallbacks,
  PaymentEventRecord,
} from './types'

// utilities
export { formatPrice } from './stripe/prices'

// components
export { PricingCard, type PricingCardProps } from './components/PricingCard'
export { SubscriptionBadge, type SubscriptionBadgeProps } from './components/SubscriptionBadge'

// hooks
export { useOpenCheckout } from './components/CheckoutButton'
export { useCheckout, type UseCheckoutReturn, type UseCheckoutOptions } from './hooks/useCheckout'
export {
  useManageSubscription,
  type UseManageSubscriptionReturn,
} from './hooks/useManageSubscription'
