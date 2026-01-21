import { formatPhoneNumber } from '@take-out/helpers'
import { createRoute, useParams, useRouter } from 'one'
import { memo, useLayoutEffect, useRef, useState } from 'react'
import { Keyboard } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Checkbox, SizableText, useEvent, XStack, YStack } from 'tamagui'

import { APP_NAME, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '~/constants/app'
import { validateLoginOtpCode } from '~/features/auth/client/otpLogin'
import { shouldUsePasswordOnlyAuth } from '~/features/auth/constants'
import { Link } from '~/interface/app/Link'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Pressable } from '~/interface/buttons/Pressable'
import { showError } from '~/interface/dialogs/actions'
import { isSmallScreen } from '~/interface/dimensions'
import { Input } from '~/interface/forms/Input'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { DeviceMobileSpeakerIcon } from '~/interface/icons/phosphor/DeviceMobileSpeakerIcon'
import { EnvelopeSimpleIcon } from '~/interface/icons/phosphor/EnvelopeSimpleIcon'
import { KeyboardStickyFooter } from '~/interface/keyboard/KeyboardStickyFooter'
import { StepPageLayout } from '~/interface/pages/StepPageLayout'

import type React from 'react'
import type { GestureResponderEvent } from 'react-native'

const route = createRoute<'/(app)/auth/signup/[method]'>()

export const SignupPage = memo(() => {
  const { method } = useParams<{
    method?: 'phone' | 'email'
  }>()
  const { top } = useSafeAreaInsets()
  const router = useRouter()
  const inputRef = useRef<Input>(null)
  const [inputValue, setInputValue] = useState<string>('')
  const isPhone = method === 'phone'
  const Icon = isPhone ? DeviceMobileSpeakerIcon : EnvelopeSimpleIcon
  const [loading, setLoading] = useState<boolean>(false)
  const [smsConsent, setSmsConsent] = useState<boolean>(false)

  const isDisabled = !inputValue.trim() || (isPhone && !smsConsent)

  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 650) // Small delay for smoother animation

    return () => clearTimeout(timer)
  }, [])

  const getMethodTitle = () => {
    switch (method) {
      case 'phone':
        return 'Continue with Phone'
      case 'email':
        return 'Continue with Email'
      default:
        return 'Sign Up'
    }
  }

  const getMethodDescription = () => {
    switch (method) {
      case 'phone':
        return 'Sign in or sign up with your phone number.'
      case 'email':
        return 'Sign in or sign up with your email.'
    }
    return ''
  }

  const toggleSmsConsent = useEvent(() => setSmsConsent((v) => !v))
  const handleSmsConsentChange = useEvent((val: boolean | 'indeterminate') =>
    setSmsConsent(!!val)
  )

  const stopPropagation = useEvent((e: GestureResponderEvent | React.MouseEvent) =>
    e.stopPropagation()
  )
  const handleGoBack = useEvent(() => router.back())

  const handleContinue = useEvent(async () => {
    if (!method) {
      showError('Authentication method is not specified.')
      return
    }

    const tm = setTimeout(() => {
      setLoading(true)
    }, 1000)

    try {
      if (shouldUsePasswordOnlyAuth) {
        router.push(
          `/auth/login/password?method=${method}&value=${encodeURIComponent(inputValue)}`
        )
        return
      }

      const { success, error } = await validateLoginOtpCode(method, inputValue)

      if (success) {
        router.push(
          `/auth/signup/otp?method=${method}&value=${encodeURIComponent(inputValue)}`
        )
        return
      }
      Keyboard.dismiss()
      showError(error)
    } finally {
      clearTimeout(tm)
      setLoading(false)
    }
  })

  // Only show content for phone and email methods
  if (method !== 'phone' && method !== 'email') {
    return (
      <YStack flex={1} bg="$background" pt={top} px="$4">
        <XStack items="center" gap="$3">
          <Pressable onPress={handleGoBack}>
            <CaretLeftIcon size={24} />
          </Pressable>
        </XStack>
        <YStack flex={1} items="center" justify="center">
          <SizableText fontSize={16} opacity={0.6}>
            Invalid authentication method
          </SizableText>
        </YStack>
      </YStack>
    )
  }

  const placeholder = isPhone ? '(202) 555-2813' : 'Enter email address'

  return (
    <StepPageLayout
      title={getMethodTitle()}
      Icon={Icon}
      description={getMethodDescription()}
      disableScroll={!isSmallScreen}
      bottom={
        <KeyboardStickyFooter openedOffset={-10}>
          <ButtonSimple
            glass
            glassTint={isDisabled ? 'transparent' : 'darkslateblue'}
            data-testid="next-button"
            size="large"
            pressStyle={{
              scale: 0.97,
              opacity: 0.9,
            }}
            onPress={handleContinue}
            disabled={isDisabled}
          >
            {loading ? 'Processing...' : 'Next'}
          </ButtonSimple>
        </KeyboardStickyFooter>
      }
    >
      <YStack gap="$4">
        <Input
          data-testid={isPhone ? 'phone-input' : 'email-input'}
          glass
          ref={inputRef}
          placeholder={placeholder}
          value={isPhone ? formatPhoneNumber(inputValue) : inputValue}
          onChange={(e) => setInputValue((e.target as HTMLInputElement).value)}
          autoCapitalize="none"
          onSubmitEditing={handleContinue}
          type={isPhone ? 'tel' : 'email'}
          {...(isPhone
            ? {
                name: 'tel',
                autoComplete: 'tel',
                inputMode: 'tel',
                maxLength: 14, // (XXX) XXX-XXXX = 14 characters with formatting
              }
            : {
                name: 'email',
                autoComplete: 'email',
                inputMode: 'email',
              })}
        />
        {isPhone && (
          <Pressable
            data-testid="sms-consent-container"
            onPress={toggleSmsConsent}
            borderWidth={1}
            borderColor="$color6"
            rounded="$6"
            p="$2"
          >
            <XStack gap="$3" items="flex-start">
              <Checkbox
                data-testid="sms-consent-checkbox"
                size="$7"
                checked={smsConsent}
                onCheckedChange={handleSmsConsentChange}
                overflow="hidden"
              >
                <Checkbox.Indicator backgroundColor="#AB4ABA" padding={8}>
                  <CheckIcon />
                </Checkbox.Indicator>
              </Checkbox>
              <YStack gap="$2" flex={1}>
                <SizableText fontSize={14} color="$accent8">
                  You agree to receive transactional texts from {APP_NAME}. Frequency
                  varies. Msg & data rates may apply. Reply STOP to unsubscribe.
                </SizableText>
                <XStack gap="$2" flexWrap="wrap">
                  <Link
                    href={PRIVACY_POLICY_URL}
                    onPress={stopPropagation}
                    textDecorationLine="underline"
                    fontSize={14}
                    color="$accent8"
                  >
                    Privacy Policy
                  </Link>
                  <SizableText opacity={0.3}>|</SizableText>
                  <Link
                    href={TERMS_OF_SERVICE_URL}
                    onPress={stopPropagation}
                    textDecorationLine="underline"
                    fontSize={14}
                    color="$accent8"
                  >
                    Terms of Service
                  </Link>
                </XStack>
              </YStack>
            </XStack>
          </Pressable>
        )}
      </YStack>
    </StepPageLayout>
  )
})
