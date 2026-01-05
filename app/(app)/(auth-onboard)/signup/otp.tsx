import { router, useParams, useRouter } from 'one'
import { useEffect, useState } from 'react'
import { Keyboard } from 'react-native'
import { SizableText, useEvent, YStack } from 'tamagui'

import { otpLogin, validateLoginOtpCode } from '~/features/auth/client/otpLogin'
import { OtpInput } from '~/features/auth/ui/OtpInput'
import { useTimer } from '~/helpers/time/useTimer'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { showError } from '~/interface/dialogs/actions'
import { isSmallScreen } from '~/interface/dimensions'
import { PasswordIcon } from '~/interface/icons/phosphor/PasswordIcon'
import { KeyboardStickyFooter } from '~/interface/keyboard/KeyboardStickyFooter'
import { StepPageLayout } from '~/interface/pages/StepPageLayout'

export const OtpPage = () => {
  const timer = useTimer()
  const params = useParams<{ method?: 'phone' | 'email'; value?: string }>()
  const [otpCode, setOtpCode] = useState<string>('')
  const [isError, setIsError] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [otpKey, setOtpKey] = useState(0)

  const isPhone = params.method === 'phone'

  const isDisabled = otpCode.length !== 6 || loading

  const displayValue =
    params.value || (isPhone ? '1 (203) 555-2415' : 'email@example.com')

  const handleResendOtp = useEvent(async () => {
    if (!params.method || !params.value) {
      showError('Authentication method or value is not specified.')
      return
    }
    // Keep loading state active - useAfterLoginRedirect will handle navigation
    // Loading will be cleared when component unmounts due to navigation
    setLoading(true)
    setOtpCode('')
    setOtpKey(Math.random())
    try {
      const { error } = await validateLoginOtpCode(params.method, params.value)

      if (error) {
        showError(error)
      }

      setIsError(!!error)
      timer.start(30, true)
    } finally {
      setLoading(false)
    }
  })

  const handleCodeChanged = useEvent((code: string) => {
    setOtpCode(code)
    if (isError && code.length < 6) {
      setIsError(false)
    }
  })

  const handleContinue = useEvent(async () => {
    if (!params.method || !params.value) {
      showError('Authentication method or value is not specified.')
      return
    }

    setLoading(true)

    try {
      const { error } = await otpLogin(params.method, params.value, otpCode)

      if (error) {
        setIsError(true)
        Keyboard.dismiss()
        showError(error)
        setOtpCode('')
        setOtpKey(Math.random())
        setLoading(false)
        return
      }

      timer.pause()
      router.replace('/home')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    timer.start(30, true)
  }, [timer.start])

  useEffect(() => {
    if (otpCode.length === 6) {
      handleContinue()
    }
  }, [handleContinue, otpCode])

  return (
    <StepPageLayout
      title="Enter Code"
      Icon={PasswordIcon}
      disableScroll={!isSmallScreen}
      description={
        isPhone
          ? `We sent a verification code to your phone number`
          : `We sent a verification code to your email`
      }
      descriptionSecondLine={displayValue}
      bottom={
        <KeyboardStickyFooter openedOffset={-10}>
          <ButtonSimple
            glass
            glassTint={isDisabled ? 'transparent' : 'darkslateblue'}
            width="100%"
            data-testid="verify-otp-button"
            size="large"
            // No need func here because we have onCodeFilled in OtpInput
            disabled={isDisabled}
            onPress={handleContinue}
          >
            {loading ? 'Verifying...' : 'Next'}
          </ButtonSimple>
        </KeyboardStickyFooter>
      }
    >
      <YStack items="center" gap="$6">
        <OtpInput
          data-testid="otp-input"
          key={otpKey}
          autoFocus
          otpCount={6}
          onCodeChanged={handleCodeChanged}
          defaultValue={otpCode}
          isError={isError}
        />
        {timer.count > 0 ? (
          <SizableText size="$4" color="$color11">
            Resend Code in ({timer.count})
          </SizableText>
        ) : (
          <ButtonSimple data-testid="resend-otp-button" onPress={handleResendOtp}>
            Resend
          </ButtonSimple>
        )}
      </YStack>
    </StepPageLayout>
  )
}
