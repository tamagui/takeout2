import { formatPhoneNumber } from '@take-out/helpers'
import { useParams, useRouter, createRoute } from 'one'
import { useState } from 'react'
import { Checkbox, Circle, SizableText, useEvent, XStack, YStack } from 'tamagui'

import { APP_NAME, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '~/constants/app'
import { validateLoginOtpCode } from '~/features/auth/client/otpLogin'
import { shouldUsePasswordOnlyAuth } from '~/features/auth/constants'
import { Link } from '~/interface/app/Link'
import { ButtonAction } from '~/interface/buttons/ButtonAction'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { HeaderBackButton } from '~/interface/buttons/HeaderBackButton'
import { showError } from '~/interface/dialogs/actions'
import { Input } from '~/interface/forms/Input'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { DeviceMobileSpeakerIcon } from '~/interface/icons/phosphor/DeviceMobileSpeakerIcon'
import { EnvelopeSimpleIcon } from '~/interface/icons/phosphor/EnvelopeSimpleIcon'
import { H2 } from '~/interface/text/Headings'

import type React from 'react'

const route = createRoute<'/(app)/auth/signup/[method]'>()

export const SignupPage = () => {
  const { method } = useParams<{ method?: 'phone' | 'email' }>()
  const router = useRouter()
  const [inputValue, setInputValue] = useState<string>('')
  const isPhone = method === 'phone'
  const Icon = isPhone ? DeviceMobileSpeakerIcon : EnvelopeSimpleIcon
  const [loading, setLoading] = useState<boolean>(false)
  const [smsConsent, setSmsConsent] = useState<boolean>(false)

  const isDisabled = !inputValue.trim() || (isPhone && !smsConsent)

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

  const stopPropagation = useEvent((e: { stopPropagation: () => void }) =>
    e.stopPropagation()
  )

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
      showError(error)
    } finally {
      clearTimeout(tm)
      setLoading(false)
    }
  })

  if (method !== 'phone' && method !== 'email') {
    return (
      <YStack gap="$4" width="100%" items="center" maxW={340}>
        <XStack width="100%" items="center">
          <HeaderBackButton />
        </XStack>
        <SizableText size="$4" color="$color10">
          Invalid authentication method
        </SizableText>
      </YStack>
    )
  }

  const placeholder = isPhone ? '(202) 555-2813' : 'Enter email address'

  return (
    <YStack
      flex={1}
      flexBasis="auto"
      gap="$5"
      p="$10"
      width="100%"
      height="100%"
      items="center"
      transition="medium"
      enterStyle={{ opacity: 0, y: 10 }}
      exitStyle={{ opacity: 0, y: -10 }}
      $maxSM={{ p: '$6' }}
    >
      <YStack flex={1} flexBasis="auto" gap="$4" width="100%">
        <YStack gap="$4" width="100%" items="center">
          <Circle size={52} bg="$color2" borderWidth={0.5} borderColor="$color3">
            <Icon size={28} color="$color11" />
          </Circle>

          <YStack gap="$2" items="center">
            <H2 text="center">{getMethodTitle()}</H2>
            <SizableText size="$3" color="$color10" text="center">
              {getMethodDescription()}
            </SizableText>
          </YStack>
        </YStack>

        <YStack gap="$4" width="100%">
          <Input
            data-testid={isPhone ? 'phone-input' : 'email-input'}
            glass
            placeholder={placeholder}
            value={isPhone ? formatPhoneNumber(inputValue) : inputValue}
            onChange={(e) => setInputValue((e.target as HTMLInputElement).value)}
            autoCapitalize="none"
            onSubmitEditing={handleContinue}
            type={isPhone ? 'tel' : 'email'}
            autoFocus
            {...(isPhone
              ? {
                  name: 'tel',
                  autoComplete: 'tel',
                  inputMode: 'tel',
                  maxLength: 14,
                }
              : {
                  name: 'email',
                  autoComplete: 'email',
                  inputMode: 'email',
                })}
          />

          {isPhone && (
            <ButtonSimple
              data-testid="sms-consent-container"
              onPress={toggleSmsConsent}
              borderWidth={1}
              borderColor="$color6"
              rounded="$6"
              p="$3"
              height="auto"
            >
              <XStack gap="$3" items="flex-start">
                <Checkbox
                  data-testid="sms-consent-checkbox"
                  size="$5"
                  checked={smsConsent}
                  onCheckedChange={handleSmsConsentChange}
                  overflow="hidden"
                >
                  <Checkbox.Indicator backgroundColor="#AB4ABA" padding={6}>
                    <CheckIcon size={14} />
                  </Checkbox.Indicator>
                </Checkbox>
                <YStack gap="$2" flex={1}>
                  <SizableText size="$2" color="$color10">
                    You agree to receive transactional texts from {APP_NAME}. Frequency
                    varies. Msg & data rates may apply. Reply STOP to unsubscribe.
                  </SizableText>
                  <XStack gap="$2" flexWrap="wrap">
                    <Link
                      href={PRIVACY_POLICY_URL}
                      onPress={stopPropagation}
                      textDecorationLine="underline"
                      fontSize={12}
                      color="$color10"
                    >
                      Privacy Policy
                    </Link>
                    <SizableText opacity={0.3} size="$2">
                      |
                    </SizableText>
                    <Link
                      href={TERMS_OF_SERVICE_URL}
                      onPress={stopPropagation}
                      textDecorationLine="underline"
                      fontSize={12}
                      color="$color10"
                    >
                      Terms of Service
                    </Link>
                  </XStack>
                </YStack>
              </XStack>
            </ButtonSimple>
          )}

          <ButtonAction
            theme="accent"
            data-testid="next-button"
            size="large"
            onPress={handleContinue}
            disabled={isDisabled}
            opacity={isDisabled ? 0.5 : 1}
          >
            {loading ? 'Processing...' : 'Next'}
          </ButtonAction>
        </YStack>
      </YStack>
    </YStack>
  )
}
