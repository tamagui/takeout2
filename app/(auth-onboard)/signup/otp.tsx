import { useParams } from 'one'
import { useEffect, useState } from 'react'
import { Keyboard } from 'react-native'
import { SizableText, useEvent, YStack } from 'tamagui'
import { useOnboarding } from '~/features/onboarding/useOnboarding'
import { useTimer } from '~/helpers/time/useTimer'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Pressable } from '~/interface/buttons/Pressable'
import { isSmallScreen } from '~/interface/dimensions'
import { PasswordIcon } from '~/interface/icons/phosphor/PasswordIcon'
import { StepPageLayout } from '~/interface/pages/StepPageLayout'
import { showErrorSheet } from '~/interface/sheet/errorSheetHelper'
  import { otpLogin, validateLoginOtpCode } from '~/features/auth/client/otpLogin'
  import { OtpInput } from '~/features/auth/ui/OtpInput'

export const OtpPage = () => {
  const timer = useTimer()
  const params = useParams<{ method?: 'phone' | 'email'; value?: string }>()
  const [otpCode, setOtpCode] = useState<string>('')
  const [isError, setIsError] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [otpKey, setOtpKey] = useState(0)

  useOnboarding()

  const isPhone = params.method === 'phone'

  const displayValue =
    params.value || (isPhone ? '1 (203) 962-2415' : 'example@gmail.com')

  const handleResendOtp = useEvent(async () => {
    if (!params.method || !params.value) {
      showErrorSheet({
        title: 'Error',
        description: 'Authentication method or value is not specified.',
      })
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
        showErrorSheet({
          title: error.title,
          description: error.message,
          cancelText: 'Okay',
        })
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
      showErrorSheet({
        title: 'Error',
        description: 'Authentication method or value is not specified.',
        cancelText: 'Okay',
      })
      return
    }
    setLoading(true)
    try {
      const { error } = await otpLogin(params.method, params.value, otpCode)

      if (error) {
        setIsError(true)
        Keyboard.dismiss()
        showErrorSheet({
          title: error.title,
          description: error.message,
          cancelText: 'Okay',
          onCancel: () => {
            setIsError(false)
            setOtpCode('')
            setOtpKey(Math.random())
            setLoading(false)
          },
        })
        return
      } else {
        timer.pause()
        // useOnboarding hook will handle navigation
      }
    } catch (err) {
      setLoading(false)
      throw err
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
        <ButtonSimple
          glass
          width="100%"
          data-testid="verify-otp-button"
          size="large"
          // No need func here because we have onCodeFilled in OtpInput
          disabled={otpCode.length !== 6 || loading}
        >
          {loading ? 'Verifying...' : 'Next'}
        </ButtonSimple>
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
          <SizableText fontSize={16} opacity={0.6}>
            Resend Code in ({timer.count})
          </SizableText>
        ) : (
          <Pressable data-testid="resend-otp-button" onPress={handleResendOtp}>
            <SizableText textDecorationLine="underline" fontWeight="500">
              Resend
            </SizableText>
          </Pressable>
        )}
      </YStack>
    </StepPageLayout>
  )
}
