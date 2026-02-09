import { type ReactElement, useMemo } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { type Appearance, type StripeElementsOptions, loadStripe } from '@stripe/stripe-js'

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
  clientSecret: string
  amount?: number
  currency?: string
  appearance?: Appearance
  children: React.ReactNode
}

export const StripeProvider = ({
  publishableKey,
  clientSecret,
  appearance,
  children,
}: StripeProviderProps): ReactElement => {
  const stripe = useMemo(() => getStripe(publishableKey), [publishableKey])

  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: appearance ?? {
        theme: 'stripe',
        variables: {
          borderRadius: '8px',
          spacingUnit: '4px',
        },
      },
    }),
    [clientSecret, appearance]
  )

  return (
    <Elements stripe={stripe} options={options}>
      {children}
    </Elements>
  )
}
