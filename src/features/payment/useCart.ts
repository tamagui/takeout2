import { useCallback, useMemo, useState } from 'react'

import type { CartItem, Product, ProductPrice } from './types'

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((product: Product, price: ProductPrice) => {
    setItems((prev) => {
      if (prev.some((i) => i.price.id === price.id)) return prev
      return [...prev, { product, price }]
    })
  }, [])

  const removeItem = useCallback((priceId: string) => {
    setItems((prev) => prev.filter((i) => i.price.id !== priceId))
  }, [])

  const toggleItem = useCallback((product: Product, price: ProductPrice) => {
    setItems((prev) => {
      if (prev.some((i) => i.price.id === price.id)) {
        return prev.filter((i) => i.price.id !== price.id)
      }
      return [...prev, { product, price }]
    })
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const isInCart = useCallback(
    (priceId: string) => items.some((i) => i.price.id === priceId),
    [items]
  )

  const computed = useMemo(() => {
    const hasRecurring = items.some((i) => i.price.type === 'recurring')
    const hasOneTime = items.some((i) => i.price.type === 'one_time')
    const subtotal = items.reduce((sum, i) => sum + (i.price.amount ?? 0), 0)
    const currency = items[0]?.price.currency ?? 'usd'
    const isEmpty = items.length === 0
    const itemCount = items.length

    // check if recurring items have different billing intervals (monthly + yearly)
    const recurringIntervals = new Set(
      items.filter((i) => i.price.type === 'recurring').map((i) => i.price.interval)
    )
    const hasMixedIntervals = recurringIntervals.size > 1

    // stripe mode: if any recurring, use subscription (one-time items go on first invoice)
    const stripeMode: 'payment' | 'subscription' = hasRecurring ? 'subscription' : 'payment'

    return { hasRecurring, hasOneTime, subtotal, currency, isEmpty, itemCount, stripeMode, hasMixedIntervals }
  }, [items])

  return {
    items,
    addItem,
    removeItem,
    toggleItem,
    clearCart,
    isInCart,
    ...computed,
  }
}
