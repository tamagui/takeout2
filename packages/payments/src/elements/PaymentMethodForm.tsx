import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { type ReactElement, useCallback, useState } from 'react'

import type { PaymentElementProps } from '@stripe/react-stripe-js'

export interface PaymentMethodFormProps {
  onSuccess?: (paymentMethodId: string) => void
  onError?: (error: Error) => void
  layout?: NonNullable<PaymentElementProps['options']>['layout']
  children: (props: {
    submit: () => Promise<void>
    loading: boolean
    error: string | null
  }) => ReactElement
}

// collects payment details and creates a PaymentMethod (no confirmation)
// use with StripeProvider in deferred mode (mode + amount + currency)
export const PaymentMethodForm = ({
  onSuccess,
  onError,
  layout = 'tabs',
  children,
}: PaymentMethodFormProps): ReactElement => {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async () => {
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message ?? 'payment validation failed')
        onError?.(new Error(submitError.message ?? 'payment validation failed'))
        return
      }

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        elements,
      })

      if (pmError) {
        setError(pmError.message ?? 'failed to create payment method')
        onError?.(new Error(pmError.message ?? 'failed to create payment method'))
        return
      }

      if (paymentMethod) {
        onSuccess?.(paymentMethod.id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unexpected error'
      setError(message)
      onError?.(err instanceof Error ? err : new Error(message))
    } finally {
      setLoading(false)
    }
  }, [stripe, elements, onSuccess, onError])

  return (
    <>
      <PaymentElement options={{ layout }} />
      {children({ submit, loading, error })}
    </>
  )
}
