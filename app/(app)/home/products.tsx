import { formatPrice } from '@take-out/payments'
import { PaymentMethodForm, StripeProvider } from '@take-out/payments/elements'
import { useCallback, useState } from 'react'
import {
  H3,
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
import { useCart } from '~/features/payment/useCart'
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
  const [showCoupon, setShowCoupon] = useState(false)

  const {
    products,
    loading,
    error: productsError,
  } = useProducts(auth.state === 'logged-in')
  const cart = useCart()
  const checkout = usePaymentCheckout(checkoutMode)

  const error = checkout.error || productsError

  // check for success/canceled from stripe redirect
  const params =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const success = params?.get('success') === 'true'
  const canceled = params?.get('canceled') === 'true'

  const handleCheckout = useCallback(() => {
    checkout.startCheckout(cart.items)
  }, [checkout, cart.items])

  const handlePaymentMethodCreated = useCallback(
    (paymentMethodId: string) => {
      checkout.submitOrder(paymentMethodId, cart.items)
    },
    [checkout, cart.items]
  )

  const handleDialogClose = useCallback(() => {
    checkout.closeDialog()
    if (checkout.paymentSuccess) {
      cart.clearCart()
    }
  }, [checkout, cart])

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
                    const inCart = cart.isInCart(price.id)

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
                          variant={inCart ? 'outlined' : 'action'}
                          onPress={() => cart.toggleItem(product, price)}
                        >
                          <Button.Text>{inCart ? 'Remove' : 'Add'}</Button.Text>
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

      {/* cart summary bar */}
      {!cart.isEmpty ? (
        <XStack
          p="$4"
          gap="$4"
          items="center"
          justify="space-between"
          borderTopWidth={1}
          borderColor="$color4"
          bg="$color2"
        >
          <YStack gap="$1">
            <SizableText size="$3" color="$color10">
              {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
              {cart.hasRecurring && cart.hasOneTime ? ' (one-time + subscription)' : ''}
            </SizableText>
            <SizableText size="$5" fontWeight="700">
              {formatPrice(cart.subtotal, cart.currency)}
            </SizableText>
          </YStack>

          <XStack gap="$2">
            <Button size="small" variant="outlined" onPress={cart.clearCart}>
              Clear
            </Button>
            <Button
              variant="action"
              disabled={checkout.loading}
              onPress={handleCheckout}
              gap="$2"
            >
              {checkout.loading ? (
                <Spinner
                  size="small"
                  transition="bouncy"
                  enterStyle={{ scale: 0 }}
                  exitStyle={{ scale: 0 }}
                />
              ) : null}
              <Button.Text>
                {checkout.loading
                  ? checkoutMode === 'hosted'
                    ? 'Redirecting'
                    : 'Loading'
                  : 'Checkout'}
              </Button.Text>
            </Button>
          </XStack>
        </XStack>
      ) : null}

      {/* embedded checkout dialog */}
      <Dialog
        open={checkout.dialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose()
        }}
        minH={500}
        minW={960}
      >
        <Dialog.Header title="Checkout" hidden />

        <Dialog.Body>
          {checkout.paymentSuccess ? (
            <YStack gap="$4" p="$6" items="center" justify="center">
              <YStack
                gap="$3"
                p="$5"
                rounded="$4"
                bg="$green3"
                borderWidth={1}
                borderColor="$green7"
                items="center"
                width="100%"
                maxW={400}
              >
                <SizableText size="$6" fontWeight="700" color="$green11">
                  Payment succeeded
                </SizableText>
                <Paragraph size="$3" color="$green11">
                  Thank you for your purchase.
                </Paragraph>
                <Button variant="action" onPress={handleDialogClose} mt="$2">
                  <Button.Text>Done</Button.Text>
                </Button>
              </YStack>
            </YStack>
          ) : (
            <XStack gap="$6" flex={1} overflow="hidden">
              {/* left: payment form */}
              <YStack flex={1} gap="$4" overflow="hidden">
                <H3>Payment details</H3>
                <Separator />

                <ScrollView flex={1}>
                  <YStack gap="$4" pr="$1">
                    <StripeProvider
                      publishableKey={PUBLISHABLE_KEY}
                      mode={cart.stripeMode}
                      amount={cart.subtotal}
                      currency={cart.currency}
                    >
                      <PaymentMethodForm
                        layout="accordion"
                        onSuccess={handlePaymentMethodCreated}
                        onError={(err) => console.info('[products] payment error:', err)}
                      >
                        {({ submit, error: formError }) => (
                          <YStack gap="$2">
                            {formError ? (
                              <Paragraph size="$3" color="$red10">
                                {formError}
                              </Paragraph>
                            ) : null}
                            {checkout.error ? (
                              <Paragraph size="$3" color="$red10">
                                {checkout.error}
                              </Paragraph>
                            ) : null}

                            <Button
                              variant="action"
                              self="flex-end"
                              disabled={checkout.loading}
                              onPress={submit}
                              gap="$2"
                              mt="$2"
                            >
                              {checkout.loading ? (
                                <Spinner
                                  size="small"
                                  transition="bouncy"
                                  enterStyle={{ scale: 0 }}
                                  exitStyle={{ scale: 0 }}
                                />
                              ) : null}
                              <Button.Text fontFamily="$mono">
                                {checkout.loading ? 'Processing...' : 'Complete purchase'}
                              </Button.Text>
                            </Button>
                          </YStack>
                        )}
                      </PaymentMethodForm>
                    </StripeProvider>
                  </YStack>
                </ScrollView>
              </YStack>

              {/* right: order summary */}

              <YStack gap="$4" flex={1} minW={340}>
                <H3>Order summary</H3>
                <Separator />

                <YStack gap="$4" bg="$color2" p="$4" rounded="$4">
                  {/* line items */}
                  {cart.items.map((item) => (
                    <XStack key={item.price.id} gap="$3" items="center">
                      {item.product.images[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          width={48}
                          height={48}
                          rounded="$2"
                          objectFit="cover"
                        />
                      ) : (
                        <View
                          width={48}
                          height={48}
                          rounded="$2"
                          bg="$color4"
                          items="center"
                          justify="center"
                        >
                          <SizableText size="$5" color="$color8">
                            {item.product.name.charAt(0)}
                          </SizableText>
                        </View>
                      )}

                      <YStack flex={1} gap="$0.5">
                        <Paragraph fontFamily="$mono" size="$4">
                          {item.product.name}
                        </Paragraph>
                        {item.price.type === 'recurring' ? (
                          <Paragraph size="$2" color="$color9">
                            {item.price.interval}ly subscription
                          </Paragraph>
                        ) : (
                          <Paragraph size="$2" color="$color9">
                            one-time
                          </Paragraph>
                        )}
                      </YStack>

                      <Paragraph fontFamily="$mono" size="$4">
                        {item.price.amount != null
                          ? formatPrice(
                              item.price.amount,
                              item.price.currency,
                              item.price.interval === 'one_time'
                                ? null
                                : item.price.interval
                            )
                          : '—'}
                      </Paragraph>
                    </XStack>
                  ))}

                  {/* discount line */}
                  {checkout.promoApplied && checkout.promoDiscount ? (
                    <XStack justify="space-between" items="center">
                      <XStack gap="$2" items="center" flex={1}>
                        <Paragraph fontFamily="$mono" size="$3" color="$green10">
                          {checkout.promoApplied}
                          {checkout.promoDiscount.percentOff
                            ? ` (${checkout.promoDiscount.percentOff}% off)`
                            : ''}
                        </Paragraph>
                        <SizableText
                          size="$2"
                          color="$color9"
                          cursor="pointer"
                          hoverStyle={{ color: '$color11' }}
                          onPress={checkout.removePromo}
                        >
                          remove
                        </SizableText>
                      </XStack>
                      <Paragraph fontFamily="$mono" size="$3" color="$green10">
                        -
                        {formatPrice(
                          cart.subtotal - checkout.getDiscountedTotal(cart.subtotal),
                          cart.currency
                        )}
                      </Paragraph>
                    </XStack>
                  ) : null}

                  <Separator borderColor="$color5" />

                  {/* total */}
                  <XStack justify="space-between" items="center">
                    <H3>Total</H3>
                    <YStack items="flex-end">
                      {checkout.promoApplied ? (
                        <Paragraph
                          fontFamily="$mono"
                          size="$3"
                          opacity={0.5}
                          textDecorationLine="line-through"
                        >
                          {formatPrice(cart.subtotal, cart.currency)}
                        </Paragraph>
                      ) : null}
                      <H3 fontFamily="$mono">
                        {formatPrice(
                          checkout.getDiscountedTotal(cart.subtotal),
                          cart.currency
                        )}
                      </H3>
                    </YStack>
                  </XStack>

                  <Separator borderColor="$color5" />

                  {/* coupon code — hidden by default */}
                  {checkout.promoApplied ? null : showCoupon ? (
                    <YStack gap="$2">
                      <XStack gap="$2" items="center">
                        <Input
                          flex={1}
                          size="$3"
                          placeholder="Enter code"
                          value={checkout.promoCode}
                          onChangeText={(text: string) => {
                            checkout.setPromoCode(text)
                            checkout.setPromoError(null)
                          }}
                        />
                        <Button
                          size="small"
                          variant="action"
                          disabled={!checkout.promoCode || checkout.applyingPromo}
                          onPress={checkout.handleApplyPromo}
                          gap="$2"
                        >
                          {checkout.applyingPromo ? <Spinner size="small" /> : null}
                          <Button.Text>Apply</Button.Text>
                        </Button>
                      </XStack>
                      {checkout.promoError ? (
                        <Paragraph size="$2" color="$red10">
                          {checkout.promoError}
                        </Paragraph>
                      ) : null}
                    </YStack>
                  ) : (
                    <SizableText
                      size="$3"
                      color="$color10"
                      opacity={0.5}
                      cursor="pointer"
                      hoverStyle={{ opacity: 0.9 }}
                      onPress={() => setShowCoupon(true)}
                    >
                      Have a coupon code?
                    </SizableText>
                  )}
                </YStack>
              </YStack>
            </XStack>
          )}
        </Dialog.Body>
      </Dialog>
    </View>
  )
}
