import { useParams } from 'one'
import { useState } from 'react'
import { Keyboard } from 'react-native'
import { YStack } from 'tamagui'
import { passwordLogin } from '~/features/auth/client/passwordLogin'
import { useOnboarding } from '~/features/onboarding/useOnboarding'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { showError } from '~/interface/dialogs/actions'
import { Input } from '~/interface/forms/Input'
import { PasswordIcon } from '~/interface/icons/phosphor/PasswordIcon'
import { StepPageLayout } from '~/interface/pages/StepPageLayout'

export const PasswordPage = () => {
  const { goToNextStep } = useOnboarding()
  const params = useParams<{ method?: 'phone' | 'email'; value?: string }>()
  const [loading, setLoading] = useState<boolean>(false)

  const isPhone = params.method === 'phone'

  const displayValue =
    params.value || (isPhone ? '1 (203) 962-2415' : 'example@gmail.com')

  const [password, setPassword] = useState('')

  const handleContinue = async () => {
    if (!params.method || !params.value) {
      showError('Authentication method or value is not specified.')
      return
    }

    // Keep loading state active - useAfterLoginRedirect will handle navigation
    // Loading will be cleared when component unmounts due to navigation

    setLoading(true)

    try {
      const { error } = await passwordLogin(params.method, params.value, password)

      if (error) {
        Keyboard.dismiss()
        showError(error)
        return
      }
      await goToNextStep()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
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
