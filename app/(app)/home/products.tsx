import { formatPrice } from '@take-out/payments'
import { StripeProvider, PaymentForm } from '@take-out/payments/elements'
import { useState } from 'react'
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

import { useAuth } from '~/features/auth/client/authClient'
import { usePaymentCheckout } from '~/features/payment/usePaymentCheckout'
import { useProducts } from '~/features/payment/useProducts'
import { HeadInfo } from '~/interface/app/HeadInfo'
import { Button } from '~/interface/buttons/Button'
import { Dialog } from '~/interface/dialogs/Dialog'
import { Input } from '~/interface/forms/Input'
import { Image } from '~/interface/image/Image'
import { CheckoutModeToggle } from '~/interface/payment/CheckoutModeToggle'

import type { CheckoutMode } from '~/features/payment/types'

const PUBLISHABLE_KEY = process.env.VITE_STRIPE_PUBLISH_KEY ?? ''

export const ProductsPage = () => {
  const auth = useAuth()
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>('hosted')

  const {
    products,
    loading,
    error: productsError,
  } = useProducts(auth.state === 'logged-in')
  const checkout = usePaymentCheckout(checkoutMode)

  const error = checkout.error || productsError

  // check for success/canceled from stripe redirect
  const params =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const success = params?.get('success') === 'true'
  const canceled = params?.get('canceled') === 'true'

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
          <XStack justify="space-between" items="center">
            <H4>Products</H4>
            <CheckoutModeToggle mode={checkoutMode} onChange={setCheckoutMode} />
          </XStack>

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
                    const isLoading = checkout.activePriceId === price.id

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
                          disabled={!!checkout.activePriceId}
                          onPress={() => checkout.handleBuy(product, price)}
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
                          <Button.Text>
                            {isLoading
                              ? checkoutMode === 'hosted'
                                ? 'Redirecting'
                                : 'Loading'
                              : 'Buy'}
                          </Button.Text>
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

      {/* embedded checkout dialog */}
      <Dialog
        open={checkout.dialogOpen}
        onOpenChange={(open) => {
          if (!open) checkout.closeDialog()
        }}
        minH={500}
        minW={900}
      >
        <Dialog.Header title="Checkout" hidden />

        <Dialog.Body>
          {checkout.paymentSuccess ? (
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
              <Button size="small" variant="action" onPress={checkout.closeDialog}>
                Done
              </Button>
            </YStack>
          ) : checkout.clientSecret ? (
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
                      clientSecret={checkout.clientSecret}
                    >
                      <PaymentForm
                        layout="tabs"
                        onSuccess={(id) => {
                          console.info('[products] payment succeeded:', id)
                          checkout.setPaymentSuccess(true)
                        }}
                        onError={(err) => console.info('[products] payment error:', err)}
                      >
                        {({ submit, error: formError }) => {
                          checkout.submitRef.current = submit
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
                    {checkout.selectedProduct?.images[0] ? (
                      <Image
                        src={checkout.selectedProduct.images[0]}
                        alt={checkout.selectedProduct.name}
                        width={48}
                        height={48}
                        rounded="$2"
                        objectFit="cover"
                      />
                    ) : null}

                    <YStack flex={1} gap="$1">
                      <SizableText size="$4" fontWeight="700">
                        {checkout.selectedProduct?.name}
                      </SizableText>

                      {checkout.selectedProduct?.description ? (
                        <Paragraph size="$2" color="$color10" numberOfLines={2}>
                          {checkout.selectedProduct.description}
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
                      {checkout.selectedPrice?.amount != null
                        ? formatPrice(
                            checkout.selectedPrice.amount,
                            checkout.selectedPrice.currency
                          )
                        : '—'}
                    </SizableText>
                  </XStack>

                  {/* discount */}
                  <XStack justify="space-between" items="center">
                    <SizableText size="$3" color="$color10">
                      Discount
                    </SizableText>
                    <SizableText
                      size="$4"
                      color={checkout.promoApplied ? '$green10' : '$color10'}
                      fontWeight={checkout.promoApplied ? '600' : '400'}
                    >
                      {checkout.promoApplied && checkout.selectedPrice
                        ? `−${formatPrice(checkout.discountAmount, checkout.selectedPrice.currency)}`
                        : '—'}
                    </SizableText>
                  </XStack>

                  {/* promo code */}
                  {checkout.promoApplied ? (
                    <XStack gap="$2" items="center">
                      <SizableText size="$3" color="$green10" flex={1}>
                        {checkout.promoApplied} applied
                      </SizableText>
                      <Button
                        size="small"
                        variant="outlined"
                        onPress={checkout.removePromo}
                      >
                        Remove
                      </Button>
                    </XStack>
                  ) : (
                    <YStack gap="$1.5">
                      <XStack gap="$2" items="center">
                        <Input
                          flex={1}
                          size="$3"
                          height={36}
                          placeholder="Promo code"
                          value={checkout.promoCode}
                          onChangeText={(text: string) => {
                            checkout.setPromoCode(text)
                            checkout.setPromoError(null)
                          }}
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={!checkout.promoCode || checkout.applyingPromo}
                          onPress={checkout.handleApplyPromo}
                          gap="$2"
                        >
                          {checkout.applyingPromo ? <Spinner size="small" /> : null}
                          Apply
                        </Button>
                      </XStack>
                      {checkout.promoError ? (
                        <SizableText size="$2" color="$red10">
                          {checkout.promoError}
                        </SizableText>
                      ) : null}
                    </YStack>
                  )}

                  <Separator borderColor="$color5" />

                  {/* total */}
                  <XStack justify="space-between" items="center">
                    <SizableText size="$4" fontWeight="600">
                      Total
                    </SizableText>
                    <SizableText size="$6" fontWeight="700">
                      {checkout.discountedTotal != null && checkout.selectedPrice
                        ? formatPrice(
                            checkout.discountedTotal,
                            checkout.selectedPrice.currency
                          )
                        : checkout.selectedPrice?.amount != null
                          ? formatPrice(
                              checkout.selectedPrice.amount,
                              checkout.selectedPrice.currency
                            )
                          : 'Custom'}
                    </SizableText>
                  </XStack>
                </YStack>
              </YStack>
            </XStack>
          ) : null}
        </Dialog.Body>

        {!checkout.paymentSuccess ? (
          <Dialog.Footer>
            <XStack gap="$3" justify="space-between" flex={1}>
              {checkout.clientSecret ? (
                <Button
                  variant="action"
                  disabled={checkout.submitting}
                  onPress={checkout.handlePay}
                  gap="$2"
                >
                  {checkout.submitting ? (
                    <Spinner
                      size="small"
                      transition="bouncy"
                      enterStyle={{ scale: 0 }}
                      exitStyle={{ scale: 0 }}
                    />
                  ) : null}
                  <Button.Text>
                    {checkout.submitting
                      ? 'Processing'
                      : checkout.discountedTotal != null && checkout.selectedPrice
                        ? `Pay ${formatPrice(checkout.discountedTotal, checkout.selectedPrice.currency)}`
                        : checkout.selectedPrice?.amount != null
                          ? `Pay ${formatPrice(checkout.selectedPrice.amount, checkout.selectedPrice.currency)}`
                          : 'Pay'}
                  </Button.Text>
                </Button>
              ) : (
                <View />
              )}

              <Dialog.Close asChild>
                <Button variant="outlined" onPress={checkout.closeDialog}>
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
