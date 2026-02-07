import { useCallback, useState } from 'react'
import { useOpenCheckout } from '../components/CheckoutButton'

export interface UseCheckoutOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export interface UseCheckoutReturn {
  startCheckout: (params: { priceId: string }) => Promise<void>
  loading: boolean
  error: Error | null
}

// hook for triggering stripe checkout from any component
// requires a fetchCheckoutUrl function that calls your API to create a checkout session
export function useCheckout(
  fetchCheckoutUrl: (priceId: string) => Promise<string>,
  options?: UseCheckoutOptions
): UseCheckoutReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { openCheckout } = useOpenCheckout()

  const startCheckout = useCallback(
    async (params: { priceId: string }) => {
      setLoading(true)
      setError(null)

      try {
        const url = await fetchCheckoutUrl(params.priceId)
        openCheckout(url)
        options?.onSuccess?.()
      } catch (err) {
        const e = err instanceof Error ? err : new Error('checkout failed')
        setError(e)
        options?.onError?.(e)
      } finally {
        setLoading(false)
      }
    },
    [fetchCheckoutUrl, openCheckout, options?.onSuccess, options?.onError]
  )

  return { startCheckout, loading, error }
}
