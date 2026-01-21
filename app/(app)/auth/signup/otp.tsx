import { useTimer } from '@take-out/helpers'
import { useParams } from 'one'
import { useEffect, useState } from 'react'
import { Circle, SizableText, useEvent, XStack, YStack } from 'tamagui'

import { otpLogin, validateLoginOtpCode } from '~/features/auth/client/otpLogin'
import { OtpInput } from '~/features/auth/ui/OtpInput'
import { ButtonAction } from '~/interface/buttons/ButtonAction'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { HeaderBackButton } from '~/interface/buttons/HeaderBackButton'
import { showError } from '~/interface/dialogs/actions'
import { PasswordIcon } from '~/interface/icons/phosphor/PasswordIcon'
import { H2 } from '~/interface/text/Headings'

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
        showError(error)
        setOtpCode('')
        setOtpKey(Math.random())
        setLoading(false)
        return
      }

      timer.pause()
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
    <YStack
      gap="$5"
      width="100%"
      items="center"
      maxW={340}
      style={{ animation: 'fadeSlideIn 300ms ease-out' }}
    >
      <XStack width="100%" items="center" gap="$3">
        <HeaderBackButton />
      </XStack>

      <YStack gap="$4" width="100%" items="center">
        <Circle size={52} bg="$color2" borderWidth={0.5} borderColor="$color3">
          <PasswordIcon size={28} color="$color11" />
        </Circle>

        <YStack gap="$2" items="center">
          <H2 text="center">Enter Code</H2>
          <SizableText size="$3" color="$color10" text="center">
            {isPhone
              ? 'We sent a verification code to your phone number'
              : 'We sent a verification code to your email'}
          </SizableText>
          <SizableText size="$3" color="$color11" fontWeight="600">
            {displayValue}
          </SizableText>
        </YStack>
      </YStack>

      <YStack items="center" gap="$6" width="100%">
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

        <ButtonAction
          data-testid="verify-otp-button"
          size="large"
          width="100%"
          disabled={isDisabled}
          onPress={handleContinue}
          opacity={isDisabled ? 0.5 : 1}
        >
          {loading ? 'Verifying...' : 'Next'}
        </ButtonAction>
      </YStack>
    </YStack>
  )
}
