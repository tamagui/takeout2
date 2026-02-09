import { useEffect, useState } from 'react'

import { API_URL } from '~/constants/urls'

import type { Product } from './types'

export const useProducts = (enabled: boolean) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()

    fetch(`${API_URL}/payments/checkout`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('failed to load products')
        const data = (await res.json()) as { products: Product[] }
        setProducts(data.products)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'failed to load products')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [enabled])

  return { products, loading, error, setError }
}
