import { router, useParams } from 'one'
import { useState } from 'react'
import { Keyboard } from 'react-native'
import { YStack } from 'tamagui'

import { passwordLogin } from '~/features/auth/client/passwordLogin'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { showError } from '~/interface/dialogs/actions'
import { Input } from '~/interface/forms/Input'
import { PasswordIcon } from '~/interface/icons/phosphor/PasswordIcon'
import { StepPageLayout } from '~/interface/pages/StepPageLayout'

export const PasswordPage = () => {
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

    setLoading(true)

    try {
      const { error } = await passwordLogin(params.method, params.value, password)

      if (error) {
        Keyboard.dismiss()
        showError(error)
        return
      }
      router.replace('/home')
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
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
          onSubmitEditing={handleContinue}
        />
      </YStack>
    </StepPageLayout>
  )
}
