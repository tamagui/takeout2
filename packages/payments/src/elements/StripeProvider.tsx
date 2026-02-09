import { Elements } from '@stripe/react-stripe-js'
import {
  type Appearance,
  type StripeElementsOptions,
  loadStripe,
} from '@stripe/stripe-js'
import { type ReactElement, useMemo } from 'react'

const stripeCache = new Map<string, ReturnType<typeof loadStripe>>()

function getStripe(publishableKey: string): ReturnType<typeof loadStripe> {
  const cached = stripeCache.get(publishableKey)
  if (cached) return cached
  const promise = loadStripe(publishableKey)
  stripeCache.set(publishableKey, promise)
  return promise
}

export interface StripeProviderProps {
  publishableKey: string
  // intent mode — tied to a specific PaymentIntent/SetupIntent
  clientSecret?: string
  // deferred mode — collect payment details before creating an intent
  mode?: 'payment' | 'subscription' | 'setup'
  amount?: number
  currency?: string
  appearance?: Appearance
  children: React.ReactNode
}

export const StripeProvider = ({
  publishableKey,
  clientSecret,
  mode,
  amount,
  currency,
  appearance,
  children,
}: StripeProviderProps): ReactElement => {
  const stripe = useMemo(() => getStripe(publishableKey), [publishableKey])

  const options = useMemo((): StripeElementsOptions => {
    const sharedAppearance = appearance ?? {
      theme: 'stripe' as const,
      variables: {
        borderRadius: '8px',
        spacingUnit: '4px',
      },
    }

    // intent mode — tied to a specific PaymentIntent/SetupIntent
    if (clientSecret) {
      return { clientSecret, appearance: sharedAppearance }
    }

    // deferred mode — collect payment details before creating an intent
    // paymentMethodCreation: 'manual' is required to call createPaymentMethod with the Payment Element
    if (mode === 'payment' && amount != null && currency) {
      return {
        mode: 'payment',
        amount,
        currency,
        paymentMethodCreation: 'manual',
        appearance: sharedAppearance,
      }
    }

    if (mode === 'subscription' && amount != null && currency) {
      return {
        mode: 'subscription',
        amount,
        currency,
        paymentMethodCreation: 'manual',
        appearance: sharedAppearance,
      }
    }

    if (mode === 'setup' && currency) {
      return {
        mode: 'setup',
        currency,
        paymentMethodCreation: 'manual',
        appearance: sharedAppearance,
      }
    }

    return { appearance: sharedAppearance }
  }, [clientSecret, mode, amount, currency, appearance])

  return (
    <Elements stripe={stripe} options={options}>
      {children}
    </Elements>
  )
}
