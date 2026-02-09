import { formatPrice } from '@take-out/payments'
import { StripeProvider, PaymentForm } from '@take-out/payments/elements'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  H4,
  Paragraph,
  ScrollView,
  Separator,
  SizableText,
  Spinner,
  View,
  XStack,
  YStack,
} from 'tamagui'

import { API_URL } from '~/constants/urls'
import { useAuth } from '~/features/auth/client/authClient'
import { HeadInfo } from '~/interface/app/HeadInfo'
import { Button } from '~/interface/buttons/Button'
import { Dialog } from '~/interface/dialogs/Dialog'
import { Input } from '~/interface/forms/Input'
import { Image } from '~/interface/image/Image'

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISH_KEY ?? ''

interface ProductPrice {
  id: string
  amount: number | null
  currency: string
  interval: string
}

interface Product {
  id: string
  name: string
  description: string | null
  images: string[]
  prices: ProductPrice[]
}

export default function ProductsPage() {
  const auth = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingPriceId, setCreatingPriceId] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedPrice, setSelectedPrice] = useState<ProductPrice | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const submitRef = useRef<(() => Promise<void>) | null>(null)

  const dialogOpen = !!(clientSecret && selectedPrice && selectedProduct)

  const startPayment = useCallback(async (product: Product, price: ProductPrice) => {
    if (!price.amount) return
    setCreatingPriceId(price.id)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/payments/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: price.amount, currency: price.currency }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'failed to create payment')
      }

      const data = (await res.json()) as { clientSecret: string }
      setClientSecret(data.clientSecret)
      setSelectedProduct(product)
      setSelectedPrice(price)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to create payment')
    } finally {
      setCreatingPriceId(null)
    }
  }, [])

  const closeDialog = useCallback(() => {
    setClientSecret(null)
    setSelectedProduct(null)
    setSelectedPrice(null)
    setPaymentSuccess(false)
    setSubmitting(false)
    setPromoCode('')
  }, [])

  const handlePay = useCallback(async () => {
    if (!submitRef.current) return
    setSubmitting(true)
    await submitRef.current()
    setSubmitting(false)
  }, [])

  useEffect(() => {
    if (auth.state !== 'logged-in') return

    fetch(`${API_URL}/payments/checkout`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('failed to load products')
        const data = (await res.json()) as { products: Product[] }
        setProducts(data.products)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'failed to load products')
      })
      .finally(() => setLoading(false))
  }, [auth.state])

  if (auth.state !== 'logged-in') {
    return (
      <YStack flex={1} items="center" justify="center" p="$4">
        <SizableText>Please log in to view products</SizableText>
      </YStack>
    )
  }

  return (
    <View flex={1} flexBasis="auto">
      <HeadInfo title="Products" />

      <ScrollView flex={1}>
        <YStack flex={1} flexBasis="auto" p="$4" gap="$4" maxW={600} mx="auto">
          <H4>Products</H4>
          <Paragraph color="$color10">Test page for Stripe Elements</Paragraph>

          {loading ? (
            <Spinner />
          ) : error ? (
            <SizableText color="$red10">{error}</SizableText>
          ) : products.length === 0 ? (
            <SizableText color="$color10">
              No products found — add prices to your Stripe products
            </SizableText>
          ) : (
            products.map((product) => (
              <XStack
                key={product.id}
                gap="$4"
                p="$4"
                rounded="$4"
                borderWidth={1}
                borderColor="$color4"
                bg="$color2"
                items="center"
                hoverStyle={{ borderColor: '$color6' }}
                transition="200ms"
              >
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    width={72}
                    height={72}
                    rounded="$3"
                    objectFit="cover"
                  />
                ) : (
                  <View
                    width={72}
                    height={72}
                    rounded="$3"
                    bg="$color4"
                    items="center"
                    justify="center"
                  >
                    <SizableText size="$8" color="$color8">
                      {product.name.charAt(0)}
                    </SizableText>
                  </View>
                )}

                <YStack flex={1} gap="$1.5">
                  <SizableText size="$5" fontWeight="700">
                    {product.name}
                  </SizableText>

                  {product.description ? (
                    <Paragraph size="$2" color="$color10" numberOfLines={2}>
                      {product.description}
                    </Paragraph>
                  ) : null}
                </YStack>

                <YStack gap="$2" items="flex-end">
                  {product.prices.map((price) => {
                    const isLoading = creatingPriceId === price.id

                    return (
                      <XStack key={price.id} items="center" gap="$3">
                        <SizableText size="$4" fontWeight="600" color="$color11">
                          {price.amount != null
                            ? formatPrice(
                                price.amount,
                                price.currency,
                                price.interval === 'one_time' ? null : price.interval
                              )
                            : 'Custom'}
                        </SizableText>

                        <Button
                          size="small"
                          variant="action"
                          disabled={!!creatingPriceId}
                          onPress={() => startPayment(product, price)}
                          gap="$2"
                        >
                          {isLoading ? (
                            <Spinner
                              size="small"
                              transition="bouncy"
                              enterStyle={{ scale: 0 }}
                              exitStyle={{ scale: 0 }}
                            />
                          ) : null}
                          <Button.Text>{isLoading ? 'Loading' : 'Buy'}</Button.Text>
                        </Button>
                      </XStack>
                    )
                  })}
                </YStack>
              </XStack>
            ))
          )}
        </YStack>
      </ScrollView>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
        minH={500}
        minW={900}
      >
        <Dialog.Header title="Checkout" hidden />

        <Dialog.Body>
          {paymentSuccess ? (
            <YStack
              gap="$3"
              p="$4"
              rounded="$4"
              bg="$green3"
              borderWidth={1}
              borderColor="$green7"
            >
              <SizableText size="$5" fontWeight="700" color="$green11">
                Payment succeeded
              </SizableText>
              <Button size="small" variant="action" onPress={closeDialog}>
                Done
              </Button>
            </YStack>
          ) : clientSecret ? (
            <XStack gap="$5" flexWrap="wrap">
              {/* left: card form */}
              <YStack flex={1} minW={340}>
                <ScrollView>
                  <YStack gap="$4" p="$1">
                    <SizableText size="$5" fontWeight="600">
                      Payment Details
                    </SizableText>

                    <StripeProvider
                      publishableKey={PUBLISHABLE_KEY}
                      clientSecret={clientSecret}
                    >
                      <PaymentForm
                        layout="tabs"
                        onSuccess={(id) => {
                          console.info('[products] payment succeeded:', id)
                          setPaymentSuccess(true)
                        }}
                        onError={(err) => console.info('[products] payment error:', err)}
                      >
                        {({ submit, error: formError }) => {
                          submitRef.current = submit
                          return (
                            <YStack>
                              {formError ? (
                                <SizableText color="$red10">{formError}</SizableText>
                              ) : null}
                            </YStack>
                          )
                        }}
                      </PaymentForm>
                    </StripeProvider>
                  </YStack>
                </ScrollView>
              </YStack>

              {/* right: order summary */}
              <YStack flex={1} minW={300} gap="$4">
                <SizableText size="$5" fontWeight="600">
                  Order Summary
                </SizableText>

                <YStack
                  gap="$3"
                  p="$4"
                  rounded="$4"
                  bg="$color3"
                  borderWidth={1}
                  borderColor="$color5"
                >
                  {/* product info */}
                  <XStack gap="$3" items="center">
                    {selectedProduct?.images[0] ? (
                      <Image
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        width={48}
                        height={48}
                        rounded="$2"
                        objectFit="cover"
                      />
                    ) : null}

                    <YStack flex={1} gap="$1">
                      <SizableText size="$4" fontWeight="700">
                        {selectedProduct?.name}
                      </SizableText>

                      {selectedProduct?.description ? (
                        <Paragraph size="$2" color="$color10" numberOfLines={2}>
                          {selectedProduct.description}
                        </Paragraph>
                      ) : null}
                    </YStack>
                  </XStack>

                  <Separator borderColor="$color5" />

                  {/* subtotal */}
                  <XStack justify="space-between" items="center">
                    <SizableText size="$3" color="$color10">
                      Subtotal
                    </SizableText>
                    <SizableText size="$4" fontWeight="600">
                      {selectedPrice?.amount != null
                        ? formatPrice(selectedPrice.amount, selectedPrice.currency)
                        : '—'}
                    </SizableText>
                  </XStack>

                  {/* discount */}
                  <XStack justify="space-between" items="center">
                    <SizableText size="$3" color="$color10">
                      Discount
                    </SizableText>
                    <SizableText size="$4" color="$color10">
                      —
                    </SizableText>
                  </XStack>

                  {/* promo code */}
                  <XStack gap="$2" items="center">
                    <Input
                      flex={1}
                      size="$3"
                      height={36}
                      placeholder="Promo code"
                      value={promoCode}
                      onChangeText={setPromoCode}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!promoCode}
                      onPress={() => {
                        // TODO: validate promo code against stripe
                        console.info('[products] apply promo:', promoCode)
                      }}
                    >
                      Apply
                    </Button>
                  </XStack>

                  <Separator borderColor="$color5" />

                  {/* total */}
                  <XStack justify="space-between" items="center">
                    <SizableText size="$4" fontWeight="600">
                      Total
                    </SizableText>
                    <SizableText size="$6" fontWeight="700">
                      {selectedPrice?.amount != null
                        ? formatPrice(selectedPrice.amount, selectedPrice.currency)
                        : 'Custom'}
                    </SizableText>
                  </XStack>
                </YStack>
              </YStack>
            </XStack>
          ) : null}
        </Dialog.Body>

        {!paymentSuccess ? (
          <Dialog.Footer>
            <XStack gap="$3" justify="space-between" flex={1}>
              {clientSecret ? (
                <Button
                  variant="action"
                  disabled={submitting}
                  onPress={handlePay}
                  gap="$2"
                >
                  {submitting ? (
                    <Spinner
                      size="small"
                      transition="bouncy"
                      enterStyle={{ scale: 0 }}
                      exitStyle={{ scale: 0 }}
                    />
                  ) : null}
                  <Button.Text>
                    {submitting
                      ? 'Processing'
                      : selectedPrice?.amount != null
                        ? `Pay ${formatPrice(selectedPrice.amount, selectedPrice.currency)}`
                        : 'Pay'}
                  </Button.Text>
                </Button>
              ) : (
                <View />
              )}

              <Dialog.Close asChild>
                <Button variant="outlined" onPress={closeDialog}>
                  Cancel
                </Button>
              </Dialog.Close>
            </XStack>
          </Dialog.Footer>
        ) : null}
      </Dialog>
    </View>
  )
}
