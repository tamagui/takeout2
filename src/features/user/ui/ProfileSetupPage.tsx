import { useParams } from 'one'
import { useEffect, useRef, useState } from 'react'
import { Spinner, useDebounceValue, XStack, YStack } from 'tamagui'
import { useGoToNextOnboardingStep } from '~/auth/hooks/useGoToNextOnboardingStep'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Input } from '~/interface/forms/Input'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { SignatureIcon } from '~/interface/icons/phosphor/SignatureIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { SubTitle } from '~/interface/text/SubTitle'
import { showToast } from '~/interface/toast/helpers'
import { useQuery, zero } from '~/zero/client'
import { useUser } from '../useUser'
import { OnboardingStepPageLayout } from './OnboardingStepPageLayout'

function checkUsernameValid(username: string) {
  if (username.length < 3) return false

  if (!username.match(/^[a-z][a-z0-9_]+$/)) return false

  return true
}

export const ProfileSetupPage = () => {
  const { from } = useParams()
  const { user, loading, update } = useUser()
  const [username, setUsername] = useState<string>('')
  const [isValidating, setIsValidating] = useState(false)
  // const [name, setName] = useState<string>('')
  const nameInputRef = useRef<Input>(null)

  // check if we're coming from OTP
  const fromOtp = from === 'otp'

  // Debounce the username for availability checks
  const debouncedUsername = useDebounceValue(username.trim().toLowerCase(), 400)
  const isUsernameValid = checkUsernameValid(debouncedUsername)
  const isUsernameInvalid = debouncedUsername && !isUsernameValid

  // Query to check if username exists once debounced
  const [existingUser, availabilityStatus] = useQuery(
    zero.query.userPublic.where('username', debouncedUsername).one(),
    {
      enabled: isUsernameValid,
    }
  )

  // Determine checking and availability states
  const isCheckingAvailability =
    (isUsernameValid && username.trim().toLowerCase() !== debouncedUsername) ||
    (isUsernameValid && availabilityStatus.type !== 'complete') ||
    isValidating

  const isAvailable =
    isUsernameValid &&
    availabilityStatus.type === 'complete' &&
    // available if no user has this username, or it's the current user (editing case)
    (!existingUser || existingUser.id === user?.id)

  const isUnavailable =
    isUsernameValid &&
    availabilityStatus.type === 'complete' &&
    !!existingUser &&
    existingUser.id !== user?.id

  const canContinue = isUsernameValid && !isCheckingAvailability && isAvailable

  useEffect(() => {
    const delay = fromOtp ? 100 : 650
    // if coming from OTP, focus immediately (user is actively navigating)
    // if coming from app initialization, delay to wait for splash to hide
    const timer = setTimeout(() => {
      nameInputRef.current?.focus()
    }, delay)
    return () => clearTimeout(timer)
  }, [fromOtp])

  const goToNextStep = useGoToNextOnboardingStep(['name', 'username'])

  const handleContinue = async () => {
    if (!user || !canContinue) return

    setIsValidating(true)
    try {
      await zero.mutate.userPublic.validateUsername(username.trim()).server
      await update({
        username: username.trim(),
      }).client
      goToNextStep()
    } catch (err) {
      console.error(err)
      showToast(`Error: Invalid username`, {
        type: 'error',
      })
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <OnboardingStepPageLayout
      title="Enter Username"
      Icon={SignatureIcon}
      description="Choose a unique username for your account."
      bottom={
        <ButtonSimple
          size="large"
          onPress={handleContinue}
          disabled={!canContinue || isValidating}
          variant={!canContinue ? 'default' : 'highlight'}
          loading={loading || isValidating}
        >
          <ButtonSimple.Text>Next</ButtonSimple.Text>
        </ButtonSimple>
      }
    >
      <YStack gap="$4">
        {/* name input */}
        {/* <YStack gap="$2">
          <SubTitle size="$3" fontWeight="600">
            Your Name
          </SubTitle>
          <Input
            ref={nameInputRef}
            placeholder="John Doe"
            // autoFocus={true}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
            fontWeight="600"
            rounded="$5"
          />
        </YStack> */}

        {/* username input */}
        <YStack gap="$2">
          {/* <SubTitle size="$3" fontWeight="600">
            Username
          </SubTitle> */}
          <XStack items="center" gap="$2">
            <Input
              placeholder="johndoe"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              fontWeight="600"
              rounded="$5"
              flex={1}
            />
            <XStack position="absolute" end={0} marginEnd={16}>
              {isCheckingAvailability ? (
                <Spinner size="small" color="$color10" />
              ) : isAvailable ? (
                <CheckIcon size={18} color="$green10" />
              ) : isUsernameInvalid || isUnavailable ? (
                <XIcon size={18} color="$red10" />
              ) : null}
            </XStack>
          </XStack>
        </YStack>

        {isUnavailable && !isCheckingAvailability ? (
          <SubTitle size="$3" mt="$1" color="$red10">
            That username is not available. Try another.
          </SubTitle>
        ) : isUsernameInvalid ? (
          <SubTitle size="$3" mt="$1" color="$red10">
            Username must be at least 3 characters, start with a letter, and only contain
            letters, numbers, and underscores.
          </SubTitle>
        ) : (
          <SubTitle size="$3" mt="$2">
            Everyone can see your username, you can change it later!
          </SubTitle>
        )}
      </YStack>
    </OnboardingStepPageLayout>
  )
}
