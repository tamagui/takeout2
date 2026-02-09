// client-safe exports — types, components, hooks, utilities

// types (client-safe — no stripe sdk dependency)
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
  PaymentEventRecord,
} from './types'

// utilities
export { formatPrice } from './utils/formatPrice'

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
