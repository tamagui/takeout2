import { loadStripe } from '@stripe/stripe-js'
import { useCallback, useRef, useState } from 'react'

import { API_URL } from '~/constants/urls'

import type { CartItem, CheckoutMode } from './types'

const PUBLISHABLE_KEY = process.env.VITE_STRIPE_PUBLISH_KEY ?? ''

interface OrderResult {
  invoiceId: string | null
  subscriptionIds: string[]
  status: 'succeeded' | 'requires_action' | 'incomplete'
  clientSecret: string | null
  error?: string
}

export const usePaymentCheckout = (checkoutMode: CheckoutMode) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [confirmClientSecret, setConfirmClientSecret] = useState<string | null>(null)

  // promo code state
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState<string | null>(null)
  const [promoDiscount, setPromoDiscount] = useState<{
    percentOff: number | null
    amountOff: number | null
  } | null>(null)
  const [applyingPromo, setApplyingPromo] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)

  const submitRef = useRef<(() => Promise<void>) | null>(null)

  // hosted checkout — redirect to stripe (supports promo codes natively)
  const startHostedCheckout = useCallback(async (items: CartItem[]) => {
    if (items.length === 0) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: items.map((i) => ({ priceId: i.price.id, quantity: 1 })),
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'failed to create checkout')
      }

      const data = (await res.json()) as { url: string }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to create checkout')
      setLoading(false)
    }
  }, [])

  // embedded checkout — open dialog with PaymentMethodForm
  const startEmbeddedCheckout = useCallback((_items: CartItem[]) => {
    setDialogOpen(true)
    setError(null)
  }, [])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    setPaymentSuccess(false)
    setConfirmClientSecret(null)
    setPromoCode('')
    setPromoApplied(null)
    setPromoDiscount(null)
    setPromoError(null)
    setError(null)
    setLoading(false)
  }, [])

  // called after PaymentMethodForm creates a payment method
  const submitOrder = useCallback(
    async (paymentMethodId: string, items: CartItem[]) => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`${API_URL}/payments/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            items: items.map((i) => ({ priceId: i.price.id, quantity: 1 })),
            paymentMethodId,
            promoCode: promoApplied || undefined,
          }),
        })

        if (!res.ok) {
          const data = (await res.json()) as { error?: string }
          throw new Error(data.error || 'payment failed')
        }

        const result = (await res.json()) as OrderResult

        if (result.status === 'succeeded') {
          setPaymentSuccess(true)
        } else if (result.status === 'requires_action' && result.clientSecret) {
          // 3DS authentication required — handle via stripe.js
          const stripe = await loadStripe(PUBLISHABLE_KEY)
          if (!stripe) throw new Error('stripe failed to load')

          const { error: confirmError } = await stripe.handleNextAction({
            clientSecret: result.clientSecret,
          })

          if (confirmError) {
            throw new Error(confirmError.message || 'authentication failed')
          }

          setPaymentSuccess(true)
        } else {
          throw new Error('payment incomplete — please try again')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'payment failed')
      } finally {
        setLoading(false)
      }
    },
    [promoApplied]
  )

  // validate promo code server-side
  const handleApplyPromo = useCallback(async () => {
    if (!promoCode) return
    setApplyingPromo(true)
    setPromoError(null)

    try {
      const res = await fetch(`${API_URL}/payments/promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: promoCode, validateOnly: true }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setPromoError(data.error || 'invalid promo code')
        return
      }

      const data = (await res.json()) as {
        valid: boolean
        percentOff: number | null
        amountOff: number | null
      }

      setPromoApplied(promoCode)
      setPromoDiscount({
        percentOff: data.percentOff,
        amountOff: data.amountOff,
      })
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : 'failed to validate promo')
    } finally {
      setApplyingPromo(false)
    }
  }, [promoCode])

  const removePromo = useCallback(() => {
    setPromoApplied(null)
    setPromoDiscount(null)
    setPromoCode('')
    setPromoError(null)
  }, [])

  const startCheckout = useCallback(
    (items: CartItem[]) => {
      // stripe checkout sessions can't mix different recurring intervals (e.g. monthly + yearly)
      // detect this and fall back to the order API (embedded) which handles it correctly
      const recurringIntervals = new Set(
        items.filter((i) => i.price.type === 'recurring').map((i) => i.price.interval)
      )
      const needsOrderApi = recurringIntervals.size > 1

      if (checkoutMode === 'hosted' && !needsOrderApi) {
        startHostedCheckout(items)
      } else {
        startEmbeddedCheckout(items)
      }
    },
    [checkoutMode, startHostedCheckout, startEmbeddedCheckout]
  )

  // compute discounted total from subtotal
  const getDiscountedTotal = useCallback(
    (subtotal: number) => {
      if (!promoDiscount) return subtotal
      if (promoDiscount.percentOff) {
        return Math.max(0, Math.round(subtotal * (1 - promoDiscount.percentOff / 100)))
      }
      if (promoDiscount.amountOff) {
        return Math.max(0, subtotal - promoDiscount.amountOff)
      }
      return subtotal
    },
    [promoDiscount]
  )

  return {
    loading,
    error,
    dialogOpen,
    paymentSuccess,
    confirmClientSecret,
    promoCode,
    setPromoCode,
    promoApplied,
    promoDiscount,
    applyingPromo,
    promoError,
    setPromoError,
    submitRef,
    startCheckout,
    submitOrder,
    handleApplyPromo,
    removePromo,
    closeDialog,
    setPaymentSuccess,
    getDiscountedTotal,
  }
}
