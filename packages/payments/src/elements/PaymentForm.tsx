import { type ReactElement, useCallback, useState } from 'react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import type { PaymentElementProps } from '@stripe/react-stripe-js'

export interface PaymentFormProps {
  onSuccess?: (paymentIntentId: string) => void
  onError?: (error: Error) => void
  layout?: NonNullable<PaymentElementProps['options']>['layout']
  children: (props: {
    submit: () => Promise<void>
    loading: boolean
    error: string | null
  }) => ReactElement
}

// render prop pattern — consumer controls the submit button and layout
export const PaymentForm = ({
  onSuccess,
  onError,
  layout = 'accordion',
  children,
}: PaymentFormProps): ReactElement => {
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

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (confirmError) {
        setError(confirmError.message ?? 'payment failed')
        onError?.(new Error(confirmError.message ?? 'payment failed'))
        return
      }

      if (paymentIntent) {
        onSuccess?.(paymentIntent.id)
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
