import { useParams } from 'one'
import { useState } from 'react'
import { Keyboard } from 'react-native'
import { YStack } from 'tamagui'
import { passwordLogin } from '~/features/auth/client/passwordLogin'
import { useOnboarding } from '~/features/onboarding/useOnboarding'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Input } from '~/interface/forms/Input'
import { PasswordIcon } from '~/interface/icons/phosphor/PasswordIcon'
import { StepPageLayout } from '~/interface/pages/StepPageLayout'
import { showErrorSheet } from '~/interface/sheet/errorSheetHelper'

export const PasswordPage = () => {
  const params = useParams<{ method?: 'phone' | 'email'; value?: string }>()
  const [isError, setIsError] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  useOnboarding()

  const isPhone = params.method === 'phone'

  const displayValue =
    params.value || (isPhone ? '1 (203) 962-2415' : 'example@gmail.com')

  const [password, setPassword] = useState('')

  const handleContinue = async () => {
    if (!params.method || !params.value) {
      showErrorSheet({
        title: 'Error',
        description: 'Authentication method or value is not specified.',
        cancelText: 'Okay',
      })
      return
    }

    // Keep loading state active - useAfterLoginRedirect will handle navigation
    // Loading will be cleared when component unmounts due to navigation

    setLoading(true)

    try {
      const { error } = await passwordLogin(params.method, params.value, password)

      if (error) {
        setIsError(true)
        Keyboard.dismiss()
        showErrorSheet({
          title: error.title,
          description: error.message,
          cancelText: 'Okay',
          onCancel: () => {
            setIsError(false)
            setLoading(false)
          },
        })
        return
      }
    } catch (err) {
      setLoading(false)
      throw err
    }
  }

  return (
    <StepPageLayout
      title="Enter Password"
      Icon={PasswordIcon}
      description="Please enter the password for"
      descriptionSecondLine={displayValue}
      bottom={
        <ButtonSimple
          data-testid="submit-password-button"
          size="large"
          onPress={handleContinue}
          disabled={!password || loading}
          variant="default"
        >
          <ButtonSimple.Text>{loading ? 'Verifying...' : 'Next'}</ButtonSimple.Text>
        </ButtonSimple>
      }
    >
      <YStack>
        <Input
          data-testid="password-input"
          secureTextEntry
          autoFocus
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleContinue}
        />
      </YStack>
    </StepPageLayout>
  )
}
