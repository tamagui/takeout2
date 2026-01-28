import { createRoute, useParams, useRouter } from 'one'
import { memo, useLayoutEffect, useRef, useState } from 'react'
import { isWeb, SizableText, useEvent, YStack } from 'tamagui'

import { validateLoginOtpCode } from '~/features/auth/client/otpLogin'
import { Button } from '~/interface/buttons/Button'
import { showError } from '~/interface/dialogs/actions'
import { isSmallScreen } from '~/interface/dimensions'
import { Input } from '~/interface/forms/Input'
import { EnvelopeSimpleIcon } from '~/interface/icons/phosphor/EnvelopeSimpleIcon'
import { dismissKeyboard } from '~/interface/keyboard/dismissKeyboard'
import { KeyboardStickyFooter } from '~/interface/keyboard/KeyboardStickyFooter'
import { StepPageLayout } from '~/interface/pages/StepPageLayout'

const route = createRoute<'/(app)/auth/signup/[method]'>()

export const SignupPage = memo(() => {
  const { method } = useParams<{ method?: 'email' }>()
  const router = useRouter()
  const inputRef = useRef<Input>(null)
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

  const isDisabled = !inputValue.trim()

  useLayoutEffect(() => {
    if (isWeb) {
      inputRef.current?.focus()
      return
    }
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 650)
    return () => clearTimeout(timer)
  }, [])

  const getMethodTitle = () => {
    switch (method) {
      case 'email':
        return 'Continue with Email'
      default:
        return 'Sign Up'
    }
  }

  const getMethodDescription = () => {
    switch (method) {
      case 'email':
        return 'Sign in or sign up with your email.'
    }
    return ''
  }

  const handleContinue = useEvent(async () => {
    if (!method) {
      showError('Authentication method is not specified.')
      return
    }

    const tm = setTimeout(() => {
      setLoading(true)
    }, 1000)

    try {
      const { success, error } = await validateLoginOtpCode(method, inputValue)

      if (success) {
        router.push(
          `/auth/signup/otp?method=${method}&value=${encodeURIComponent(inputValue)}`
        )
        return
      }
      dismissKeyboard()
      showError(error)
    } finally {
      clearTimeout(tm)
      setLoading(false)
    }
  })

  if (method !== 'email') {
    return (
      <StepPageLayout title="Sign Up">
        <YStack flex={1} items="center" justify="center">
          <SizableText size="$4" color="$color10">
            Invalid authentication method
          </SizableText>
        </YStack>
      </StepPageLayout>
    )
  }

  const placeholder = 'Enter email address'

  return (
    <StepPageLayout
      title={getMethodTitle()}
      Icon={EnvelopeSimpleIcon}
      description={getMethodDescription()}
      disableScroll={!isSmallScreen}
      bottom={
        <KeyboardStickyFooter openedOffset={-10}>
          <Button
            theme="accent"
            glass
            data-testid="next-button"
            size="large"
            pressStyle={{
              scale: 0.97,
              opacity: 0.9,
            }}
            onPress={handleContinue}
            disabled={isDisabled}
            opacity={isDisabled ? 0.5 : 1}
          >
            {loading ? 'Processing...' : 'Next'}
          </Button>
        </KeyboardStickyFooter>
      }
    >
      <YStack>
        <Input
          data-testid="email-input"
          glass
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue((e.target as HTMLInputElement).value)}
          autoCapitalize="none"
          onSubmitEditing={handleContinue}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
        />
      </YStack>
    </StepPageLayout>
  )
})
