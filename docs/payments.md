---
name: takeout-payments
description: Stripe payment integration guide. payments, checkout, subscriptions, one-time purchases, cart, order API, embedded checkout, hosted checkout, promo codes, coupons, webhooks, mixed intervals, billing intervals.
---

# Payments

This guide covers the Stripe payment integration, checkout flows, and known
limitations.

## Architecture

The payment system lives in two layers:

**Package** (`packages/payments/`) - shared Stripe logic (server + client
elements):

- `src/stripe/checkout.ts` - Stripe Checkout Sessions (hosted + embedded)
- `src/stripe/orders.ts` - order API (invoice + subscription creation)
- `src/stripe/customers.ts` - customer lookup/creation by email
- `src/stripe/promos.ts` - promotion code validation
- `src/stripe/prices.ts` - price fetching with cache
- `src/elements/` - React components (StripeProvider, PaymentMethodForm)

**App** (`app/api/payments/`) - API routes:

- `checkout+api.ts` - hosted checkout sessions + product catalog
- `order+api.ts` - embedded checkout order processing
- `intent+api.ts` - single-item PaymentIntent flow
- `promo+api.ts` - promo code validation endpoint
- `webhook+api.ts` - Stripe webhook handler

**Frontend** (`src/features/payment/`):

- `useCart.ts` - cart state management
- `usePaymentCheckout.ts` - checkout orchestration (hosted + embedded)
- `useProducts.ts` - product catalog fetching
- `types.ts` - shared types

## Checkout Modes

### Hosted (Stripe Checkout Sessions)

Redirects to Stripe's hosted payment page. Supports one-time payments,
subscriptions, mixed one-time + recurring items, and built-in promo codes.

Flow: frontend -> POST `/api/payments/checkout` -> `createCheckoutSession` ->
redirect to `session.url` -> Stripe handles payment -> redirect back with
`?success=true`

### Embedded (Order API)

Opens a dialog with PaymentMethodForm. Collects payment method, then calls the
order API which creates invoices and subscriptions directly via the Stripe API.

Flow: frontend -> user enters card in dialog -> `createPaymentMethod` -> POST
`/api/payments/order` -> `createOrder` (invoice + subscriptions) -> success

The order API handles complex scenarios that Stripe Checkout Sessions cannot:

- splits one-time items into an invoice (paid immediately)
- groups recurring items by billing interval into separate subscriptions
- applies coupon discounts to both invoices and subscriptions
- handles 3DS authentication via `confirmation_secret`

## Stripe Checkout Limitations

### Mixed Billing Intervals

Stripe Checkout Sessions in `subscription` mode **cannot** mix recurring prices
with different billing intervals (e.g. monthly + yearly) in a single session.
This is a hard platform limitation documented by Stripe:

> "You currently can't create mixed interval subscriptions on Checkout Sessions"

Source: https://docs.stripe.com/billing/subscriptions/mixed-interval

**What works in hosted checkout:**

- all one-time prices (`payment` mode)
- all recurring prices with the same interval (`subscription` mode)
- one-time + recurring prices together (`subscription` mode, one-time items go
  on the first invoice)

**What does NOT work in hosted checkout:**

- monthly subscription + yearly subscription in the same session
- any mix of recurring prices with different intervals

**How we handle it:** `usePaymentCheckout.ts` detects mixed recurring intervals
in the cart and automatically falls back to the embedded/order API flow, which
handles all combinations by creating separate subscriptions per interval.

### Flexible Billing Mode

Stripe's newer "flexible billing mode" (API version `2025-06-30.basil`+) allows
mixed interval subscriptions via the Subscriptions API, but still does NOT
support them in Checkout Sessions. If we upgrade to this API version in the
future, the order API would benefit but hosted checkout would still need the
fallback.

## Order API Details

The order API (`packages/payments/src/stripe/orders.ts`) handles multi-item
orders by splitting them:

1. **One-time items** -> `invoiceItems.create` for each item, then
   `invoices.create` + `invoices.finalizeInvoice` + `invoices.pay`
2. **Recurring items** -> grouped by interval, each group becomes a
   `subscriptions.create` call

Both paths support:

- coupon discounts via `discounts: [{ coupon: couponId }]`
- 3DS authentication via `confirmation_secret.client_secret`
- rollback on failure (cancel subscriptions, refund invoice)

The order uses `payment_behavior: 'allow_incomplete'` which auto-charges
the customer's default payment method. If 3DS is required, the frontend uses
`stripe.handleNextAction()` to complete authentication.

## Cart Logic

`useCart.ts` computes:

- `hasRecurring` / `hasOneTime` - price type detection
- `hasMixedIntervals` - whether recurring items have different intervals
- `stripeMode` - `payment` (all one-time) or `subscription` (any recurring)
- `subtotal` / `currency` / `itemCount`

## Promo Codes

Two approaches depending on checkout mode:

- **Hosted**: Stripe handles promo codes natively
  (`allow_promotion_codes: true`)
- **Embedded**: validated via POST `/api/payments/promo`, coupon applied to
  order API calls

## Webhooks

The webhook handler at `app/api/payments/webhook+api.ts` processes:

- `checkout.session.completed` - fires for both hosted and embedded checkout
- `customer.subscription.updated` / `deleted` - subscription lifecycle
- `invoice.payment_succeeded` / `failed` - payment status

## Testing

Use Stripe test mode with test card numbers:

- `4242 4242 4242 4242` - succeeds immediately
- `4000 0025 0000 3155` - requires 3DS authentication
- `4000 0000 0000 9995` - insufficient funds (declined)

Test scenarios:

1. single one-time item (hosted) - should redirect to Stripe
2. single subscription (hosted) - should redirect to Stripe
3. one-time + subscription (hosted) - should redirect to Stripe (one-time goes
   on first invoice)
4. two subscriptions with different intervals (hosted) - should auto-fall back
   to embedded dialog
5. any combination (embedded) - should open dialog and use order API
6. promo code in both modes
