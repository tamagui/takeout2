import { useParams } from 'one'
import { useEffect, useState } from 'react'
import { Keyboard } from 'react-native'
import { SizableText, YStack } from 'tamagui'
import { useTimer } from '~/hooks/useTimer'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Pressable } from '~/interface/buttons/Pressable'
import { PasswordIcon } from '~/interface/icons/phosphor/PasswordIcon'
import { StepPageLayout } from '~/interface/pages/StepPageLayout'
import { showErrorSheet } from '~/interface/sheet/errorSheetHelper'
import { otpLogin, sendLoginOtpCode } from '../client/otpLogin'
import { useAfterLoginRedirect } from '../hooks/useAfterLoginRedirect'
import { OtpInput } from './OtpInput'
import { isSmallScreen } from '~/interface/dimensions'

export const OtpPage = () => {
  const [timerCount, resetTimer, pauseTimer] = useTimer()
  const params = useParams<{ method?: 'phone' | 'email'; value?: string }>()
  const [otpCode, setOtpCode] = useState<string>('')
  const [isError, setIsError] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [otpKey, setOtpKey] = useState(0)

  useAfterLoginRedirect()

  const isPhone = params.method === 'phone'

  const displayValue =
    params.value || (isPhone ? '1 (203) 962-2415' : 'example@gmail.com')

  const onResetTimer = () => {
    resetTimer(30, true)
  }

  const handleResendOtp = async () => {
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
      const { error } = await sendLoginOtpCode(params.method, params.value)

      if (error) {
        showErrorSheet({
          title: error.title,
          description: error.message,
          cancelText: 'Okay',
        })
      }

      if (error) {
        setIsError(true)
      } else {
        setIsError(false)
      }

      resetTimer(30, true)
    } finally {
      setLoading(false)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <no need>
  useEffect(() => {
    onResetTimer()
  }, [])

  const handleContinue = async () => {
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
        pauseTimer()
        // Keep loading state active - useAfterLoginRedirect will handle navigation
        // Loading will be cleared when component unmounts due to navigation
      }
    } catch (err) {
      setLoading(false)
      throw err
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <no need handleContinue>
  useEffect(() => {
    if (otpCode.length === 6) {
      handleContinue()
    }
  }, [otpCode])

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
          data-testid="verify-otp-button"
          size="large"
          // No need func here because we have onCodeFilled in OtpInput
          disabled={otpCode.length !== 6 || loading}
          variant="default"
        >
          <ButtonSimple.Text>{loading ? 'Verifying...' : 'Next'}</ButtonSimple.Text>
        </ButtonSimple>
      }
    >
      <YStack items="center" gap="$6">
        <OtpInput
          data-testid="otp-input"
          key={otpKey}
          autoFocus
          otpCount={6}
          onCodeChanged={(code) => {
            setOtpCode(code)
            if (isError && code.length < 6) {
              setIsError(false)
            }
          }}
          defaultValue={otpCode}
          isError={isError}
        />
        {timerCount > 0 ? (
          <SizableText fontSize={16} opacity={0.6}>
            Resend Code in ({timerCount})
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
