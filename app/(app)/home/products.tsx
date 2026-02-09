import { formatPrice } from '@take-out/payments'
import { useCallback, useEffect, useState } from 'react'
import {
  H4,
  Paragraph,
  ScrollView,
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
import { Image } from '~/interface/image/Image'

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
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null)

  // check for success/canceled from stripe redirect
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const success = params?.get('success') === 'true'
  const canceled = params?.get('canceled') === 'true'

  const startCheckout = useCallback(async (price: ProductPrice) => {
    if (!price.amount) return
    setCheckoutPriceId(price.id)
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
      setCheckoutPriceId(null)
    }
  }, [])

  useEffect(() => {
    if (auth.state !== 'logged-in') return

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

          {success ? (
            <YStack
              gap="$2"
              p="$4"
              rounded="$4"
              bg="$green3"
              borderWidth={1}
              borderColor="$green7"
            >
              <SizableText size="$5" fontWeight="700" color="$green11">
                Payment succeeded
              </SizableText>
              <Paragraph size="$3" color="$green11">
                Thank you for your purchase.
              </Paragraph>
            </YStack>
          ) : canceled ? (
            <YStack
              gap="$2"
              p="$4"
              rounded="$4"
              bg="$yellow3"
              borderWidth={1}
              borderColor="$yellow7"
            >
              <SizableText size="$5" fontWeight="700" color="$yellow11">
                Checkout canceled
              </SizableText>
              <Paragraph size="$3" color="$yellow11">
                Your payment was not processed.
              </Paragraph>
            </YStack>
          ) : null}

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
                    const isLoading = checkoutPriceId === price.id

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
                          disabled={!!checkoutPriceId}
                          onPress={() => startCheckout(price)}
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
                          <Button.Text>{isLoading ? 'Redirecting' : 'Buy'}</Button.Text>
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
    </View>
  )
}
