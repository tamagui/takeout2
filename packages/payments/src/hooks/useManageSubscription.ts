import { useCallback, useState } from 'react'
import { useOpenCheckout } from '../components/CheckoutButton'

export interface UseManageSubscriptionReturn {
  openPortal: () => Promise<void>
  loading: boolean
  error: Error | null
}

// hook for opening the stripe customer portal
// requires a fetchPortalUrl function that calls your API
export function useManageSubscription(
  fetchPortalUrl: () => Promise<string>
): UseManageSubscriptionReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { openCheckout } = useOpenCheckout()

  const openPortal = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const url = await fetchPortalUrl()
      openCheckout(url)
    } catch (err) {
      const e = err instanceof Error ? err : new Error('failed to open subscription portal')
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [fetchPortalUrl, openCheckout])

  return { openPortal, loading, error }
}
