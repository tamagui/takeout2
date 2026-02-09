import { useCallback, useRef, useState } from 'react'

import { API_URL } from '~/constants/urls'

import type { CheckoutMode, Product, ProductPrice } from './types'

export const usePaymentCheckout = (checkoutMode: CheckoutMode) => {
  const [activePriceId, setActivePriceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // embedded checkout state
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedPrice, setSelectedPrice] = useState<ProductPrice | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState<string | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountedTotal, setDiscountedTotal] = useState<number | null>(null)
  const [applyingPromo, setApplyingPromo] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const submitRef = useRef<(() => Promise<void>) | null>(null)

  const dialogOpen = !!(clientSecret && selectedPrice && selectedProduct)

  const startHostedCheckout = useCallback(async (price: ProductPrice) => {
    if (!price.amount) return
    setActivePriceId(price.id)
    setError(null)

    try {
      const mode = price.interval === 'one_time' ? 'payment' : 'subscription'
      const res = await fetch(`${API_URL}/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ priceId: price.id, mode }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'failed to create checkout')
      }

      const data = (await res.json()) as { url: string }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to create checkout')
      setActivePriceId(null)
    }
  }, [])

  const startEmbeddedCheckout = useCallback(
    async (product: Product, price: ProductPrice) => {
      if (!price.amount) return
      setActivePriceId(price.id)
      setError(null)

      try {
        const res = await fetch(`${API_URL}/payments/intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ priceId: price.id }),
        })

        if (!res.ok) {
          const data = (await res.json()) as { error?: string }
          throw new Error(data.error || 'failed to create payment')
        }

        const data = (await res.json()) as {
          clientSecret: string
          paymentIntentId: string
        }
        setClientSecret(data.clientSecret)
        setPaymentIntentId(data.paymentIntentId)
        setSelectedProduct(product)
        setSelectedPrice(price)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'failed to create payment')
      } finally {
        setActivePriceId(null)
      }
    },
    []
  )

  const closeDialog = useCallback(() => {
    setClientSecret(null)
    setPaymentIntentId(null)
    setSelectedProduct(null)
    setSelectedPrice(null)
    setPaymentSuccess(false)
    setSubmitting(false)
    setPromoCode('')
    setPromoApplied(null)
    setDiscountAmount(0)
    setDiscountedTotal(null)
    setPromoError(null)
  }, [])

  const handlePay = useCallback(async () => {
    if (!submitRef.current) return
    setSubmitting(true)
    try {
      await submitRef.current()
    } finally {
      setSubmitting(false)
    }
  }, [])

  const handleApplyPromo = useCallback(async () => {
    if (!promoCode || !paymentIntentId) return
    setApplyingPromo(true)
    setPromoError(null)

    try {
      const res = await fetch(`${API_URL}/payments/promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: promoCode, paymentIntentId }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setPromoError(data.error || 'invalid promo code')
        return
      }

      const data = (await res.json()) as {
        code: string
        discountAmount: number
        discountedAmount: number
        currency: string
      }

      setPromoApplied(data.code)
      setDiscountAmount(data.discountAmount)
      setDiscountedTotal(data.discountedAmount)
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : 'failed to apply promo')
    } finally {
      setApplyingPromo(false)
    }
  }, [promoCode, paymentIntentId])

  const handleBuy = useCallback(
    (product: Product, price: ProductPrice) => {
      if (checkoutMode === 'hosted') {
        startHostedCheckout(price)
      } else {
        startEmbeddedCheckout(product, price)
      }
    },
    [checkoutMode, startHostedCheckout, startEmbeddedCheckout]
  )

  const removePromo = useCallback(() => {
    setPromoApplied(null)
    setDiscountAmount(0)
    setDiscountedTotal(null)
    setPromoCode('')
    setPromoError(null)
  }, [])

  return {
    activePriceId,
    error,
    setError,
    clientSecret,
    selectedProduct,
    selectedPrice,
    paymentSuccess,
    setPaymentSuccess,
    submitting,
    promoCode,
    setPromoCode,
    promoApplied,
    discountAmount,
    discountedTotal,
    applyingPromo,
    promoError,
    setPromoError,
    submitRef,
    dialogOpen,
    handleBuy,
    handlePay,
    handleApplyPromo,
    removePromo,
    closeDialog,
  }
}
