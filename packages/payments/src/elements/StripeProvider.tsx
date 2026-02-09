import { type ReactElement, useMemo } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { type Appearance, type StripeElementsOptions, loadStripe } from '@stripe/stripe-js'

let stripePromise: ReturnType<typeof loadStripe> | null = null

function getStripe(publishableKey: string): ReturnType<typeof loadStripe> {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
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
