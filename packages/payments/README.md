# @take-out/payments

Stripe payment processing for web and native. Checkout sessions, subscriptions, webhooks, and UI components built on Tamagui.

## Setup

### 1. Stripe Dashboard (test mode)

Create products and prices in the Stripe Dashboard at https://dashboard.stripe.com/test/products. You need at least one product with a recurring price for subscriptions.

Copy the price ID (starts with `price_`) for use in your checkout flow.

Enable the Customer Portal at https://dashboard.stripe.com/test/settings/billing/portal so users can manage their subscriptions.

### 2. Environment variables

Add these to your `.env.development`:

```
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISH_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Then add them to the `env` section in `package.json` and run `bun env:update`:

```json
"env": {
  "STRIPE_SECRET_KEY": true,
  "VITE_STRIPE_PUBLISH_KEY": "",
  "STRIPE_WEBHOOK_SECRET": ""
}
```

Get your test keys from https://dashboard.stripe.com/test/apikeys.

For the webhook secret, use the Stripe CLI during development:

```bash
stripe listen --forward-to localhost:8081/api/payments/webhook
```

This prints the webhook signing secret (`whsec_...`).

### 3. Install

Already included as a workspace package. Reference it in your app:

```json
"dependencies": {
  "@take-out/payments": "workspace:*"
}
```

## Usage

### Server-side

Initialize the Stripe client once at server startup:

```typescript
import { createStripeClient } from '@take-out/payments/server'

createStripeClient({ secretKey: process.env.STRIPE_SECRET_KEY })
```

Create a checkout session from an API route:

```typescript
import { createCheckoutSession, getOrCreateCustomer } from '@take-out/payments/server'

export const POST: Endpoint = async (req) => {
  const { priceId } = await req.json()
  const authData = await getAuthDataFromRequest(auth, req)

  const customer = await getOrCreateCustomer(
    { userId: authData.id, email: authData.email },
    {
      findExisting: async (userId) => { /* query your db */ },
      saveCustomer: async (userId, customerId) => { /* save to your db */ },
    }
  )

  const session = await createCheckoutSession({
    userId: authData.id,
    email: authData.email,
    priceId,
    customerId: customer.id,
    successUrl: `${process.env.ONE_SERVER_URL}/settings/subscription?success=true`,
    cancelUrl: `${process.env.ONE_SERVER_URL}/settings/subscription?canceled=true`,
  })

  return Response.json({ url: session.url })
}
```

### Webhook handler

```typescript
import { handleWebhook, WebhookVerificationError } from '@take-out/payments/server'

export const POST: Endpoint = async (req) => {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  try {
    const result = await handleWebhook(body, signature, {
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      callbacks: {
        isEventProcessed: async (eventId) => { /* check your db */ },
        markEventProcessed: async (eventId, type) => { /* save to your db */ },
        onCheckoutCompleted: async (session) => { /* create subscription record */ },
        onSubscriptionCreated: async (sub) => { /* sync to zero */ },
        onSubscriptionUpdated: async (sub) => { /* update status */ },
        onSubscriptionDeleted: async (sub) => { /* revoke access */ },
        onInvoicePaymentSucceeded: async (invoice) => { /* store receipt */ },
        onInvoicePaymentFailed: async (invoice) => { /* notify user */ },
      },
    })

    return Response.json(result)
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return new Response('invalid signature', { status: 400 })
    }
    return new Response('webhook error', { status: 500 })
  }
}
```

### Client-side

Components and hooks work on both web and native:

```typescript
import { useCheckout, useManageSubscription } from '@take-out/payments'
import { PricingCard, SubscriptionBadge } from '@take-out/payments'

function PricingPage() {
  const { startCheckout, loading } = useCheckout(
    async (priceId) => {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId }),
      })
      const { url } = await res.json()
      return url
    }
  )

  return (
    <PricingCard plan={myPlan} onSelect={(plan) => startCheckout({ priceId: plan.stripePriceId })}>
      <Button disabled={loading}>
        {loading ? 'Loading...' : 'Subscribe'}
      </Button>
    </PricingCard>
  )
}
```

### Error handling

```typescript
import { parseStripeError } from '@take-out/payments/server'

try {
  await createCheckoutSession(params)
} catch (err) {
  const paymentError = parseStripeError(err)
  // paymentError.message is user-friendly
  // paymentError.code is the stripe error code
  // paymentError.httpStatus is the appropriate HTTP status
  return Response.json({ error: paymentError.message }, { status: paymentError.httpStatus })
}
```

## Package exports

`@take-out/payments` — client-safe types, components, hooks, and `formatPrice`:

- `PricingCard`, `SubscriptionBadge` — Tamagui components
- `useCheckout`, `useManageSubscription`, `useOpenCheckout` — hooks
- `formatPrice` — display helper
- All types (`Plan`, `SubscriptionStatus`, `UserSubscriptionInfo`, etc.)

`@take-out/payments/server` — server-only Stripe SDK operations:

- `createStripeClient`, `getStripeClient` — initialization
- `createCheckoutSession`, `createPortalSession`, `createDirectSubscription` — checkout
- `getOrCreateCustomer`, `updateCustomer`, `deleteCustomer` — customers
- `getSubscription`, `cancelSubscription`, `changeSubscriptionPlan`, etc. — subscriptions
- `listPrices`, `listProducts`, `getPrice`, `getProduct` — catalog
- `handleWebhook`, `WebhookVerificationError` — webhook processing
- `parseStripeError` — error handling
- `createIdempotencyKey`, `createStableIdempotencyKey` — retry safety

## Stripe test mode

Use these test cards during development:

- `4242 4242 4242 4242` — succeeds
- `4000 0000 0000 0002` — declined
- `4000 0025 0000 3155` — requires 3DS authentication
- `4000 0000 0000 9995` — insufficient funds

Any future expiry date and any 3-digit CVC will work.

## Architecture

The webhook handler uses a callback interface (`WebhookCallbacks`) instead of direct database access. This keeps the package database-agnostic — you wire in your own DB queries when integrating.

On native, `useOpenCheckout` uses `expo-web-browser` to open Stripe's hosted checkout in an in-app browser. On web, it uses `Linking.openURL` for a standard redirect.

Idempotency keys are applied to checkout session and subscription creation to prevent duplicate charges on network retries.
