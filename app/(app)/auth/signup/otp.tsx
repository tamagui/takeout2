import { useTimer } from '@take-out/helpers'
import { useParams } from 'one'
import { useEffect, useState } from 'react'
import { SizableText, useEvent, YStack } from 'tamagui'

import { otpLogin, validateLoginOtpCode } from '~/features/auth/client/otpLogin'
import { OtpInput } from '~/features/auth/ui/OtpInput'
import { Button } from '~/interface/buttons/Button'
import { showError } from '~/interface/dialogs/actions'
import { PasswordIcon } from '~/interface/icons/phosphor/PasswordIcon'
import { dismissKeyboard } from '~/interface/keyboard/dismissKeyboard'
import { KeyboardStickyFooter } from '~/interface/keyboard/KeyboardStickyFooter'
import { StepPageLayout } from '~/interface/pages/StepPageLayout'

export const OtpPage = () => {
  const { start: startTimer, pause: pauseTimer, count: timerCount } = useTimer()
  const params = useParams<{ method?: 'phone' | 'email'; value?: string }>()
  const [otpCode, setOtpCode] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
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
    setLoading(true)
    setOtpCode('')
    setOtpKey(Math.random())
    try {
      const { error } = await validateLoginOtpCode(params.method, params.value)

      if (error) {
        showError(error)
      }

      setIsError(!!error)
      startTimer(30, true)
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
        dismissKeyboard()
        showError(error)
        setOtpCode('')
        setOtpKey(Math.random())
        setLoading(false)
        return
      }

      pauseTimer()
    } catch {
      // error handled by auth client
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    startTimer(30, true)
  }, [startTimer])

  useEffect(() => {
    if (otpCode.length === 6) {
      handleContinue()
    }
  }, [handleContinue, otpCode])

  return (
    <StepPageLayout
      title="Enter Code"
      Icon={PasswordIcon}
      description="We sent a verification code to your email"
      descriptionSecondLine={displayValue}
      bottom={
        <KeyboardStickyFooter openedOffset={-10}>
          <Button
            theme="accent"
            glass
            data-testid="verify-otp-button"
            size="large"
            disabled={isDisabled}
            onPress={handleContinue}
            opacity={isDisabled ? 0.5 : 1}
          >
            {loading ? 'Verifying...' : 'Next'}
          </Button>
        </KeyboardStickyFooter>
      }
    >
      <YStack items="center">
        <OtpInput
          data-testid="otp-input"
          key={otpKey}
          autoFocus
          otpCount={6}
          onCodeChanged={handleCodeChanged}
          defaultValue={otpCode}
          isError={isError}
        />

        {timerCount > 0 ? (
          <SizableText size="$4" color="$color11">
            Resend Code in ({timerCount})
          </SizableText>
        ) : (
          <Button data-testid="resend-otp-button" onPress={handleResendOtp}>
            Resend
          </Button>
        )}
      </YStack>
    </StepPageLayout>
  )
}
