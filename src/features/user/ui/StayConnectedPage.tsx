import { useRouter } from 'one'
import { useState } from 'react'
import { Pressable } from 'react-native'
import { SizableText } from 'tamagui'
import { useOnboarding } from '~/features/onboarding/useOnboarding'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Input } from '~/interface/forms/Input'
import { EnvelopeSimpleIcon } from '~/interface/icons/phosphor/EnvelopeSimpleIcon'
import { useUser } from '../useUser'
import { OnboardingStepPageLayout } from './OnboardingStepPageLayout'
import { authClient } from '~/features/auth/client/authClient'
import { SERVER_URL } from '~/constants/urls'
import { showErrorSheet } from '~/interface/sheet/errorSheetHelper'

export const StayConnectedPage = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const { user, update } = useUser()

  const { goToNextStep } = useOnboarding()

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleContinue = async () => {
    if (user?.id && email.trim() && isValidEmail(email.trim())) {
      const response = await authClient.changeEmail({
        newEmail: email.trim().toLowerCase(),
        callbackURL: `${SERVER_URL}/api/auth-callbacks/email-confirmation-success`,
      })

      if (response.error) {
        showErrorSheet({
          title: 'Failed to save email',
          description: response.error.message,
        })
        return
      }

      goToNextStep()
    }
  }

  const handleSkip = () => {
    goToNextStep()
  }

  return (
    <OnboardingStepPageLayout
      title="Add Your Email"
      Icon={EnvelopeSimpleIcon}
      description="Drop your email if you want to get updates!"
      buttonRight={
        <Pressable onPress={handleSkip} hitSlop={10}>
          <SizableText color="$color11" fontSize={18} fontWeight="500">
            Skip
          </SizableText>
        </Pressable>
      }
      bottom={
        <ButtonSimple
          size="large"
          onPress={handleContinue}
          disabled={!email.trim() || !isValidEmail(email.trim()) || isUpdating}
        >
          <ButtonSimple.Text>{isUpdating ? 'Saving...' : 'Next'}</ButtonSimple.Text>
        </ButtonSimple>
      }
    >
      <Input
        placeholder="Enter email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        fontWeight="600"
        autoFocus
        rounded="$5"
        editable={!isUpdating}
      />
    </OnboardingStepPageLayout>
  )
}
