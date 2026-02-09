import { useCallback, useRef, useState } from 'react'
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

  // stable refs so useCallback doesn't re-create on every render
  const fetchRef = useRef(fetchCheckoutUrl)
  fetchRef.current = fetchCheckoutUrl
  const onSuccessRef = useRef(options?.onSuccess)
  onSuccessRef.current = options?.onSuccess
  const onErrorRef = useRef(options?.onError)
  onErrorRef.current = options?.onError

  const startCheckout = useCallback(
    async (params: { priceId: string }) => {
      setLoading(true)
      setError(null)

      try {
        const url = await fetchRef.current(params.priceId)
        openCheckout(url)
        onSuccessRef.current?.()
      } catch (err) {
        const e = err instanceof Error ? err : new Error('checkout failed')
        setError(e)
        onErrorRef.current?.(e)
      } finally {
        setLoading(false)
      }
    },
    [openCheckout]
  )

  return { startCheckout, loading, error }
}
