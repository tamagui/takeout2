import { router, useParams } from 'one'
import { useEffect, useRef, useState } from 'react'
import { Spinner, useDebounceValue, XStack, YStack } from 'tamagui'
import { userByUsername } from '~/data/queries/user'
import { OnboardingStepPageLayout } from '~/features/user/ui/OnboardingStepPageLayout'
import { useUser } from '~/features/user/useUser'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { showError } from '~/interface/dialogs/actions'
import { Input } from '~/interface/forms/Input'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { SubTitle } from '~/interface/text/SubTitle'
import { useQuery, zero } from '~/zero/client'

function checkUsernameValid(username: string) {
  if (username.length < 3) return false
  if (!username.match(/^[a-z][a-z0-9_]+$/)) return false
  return true
}

export const ProfileSetupPage = () => {
  const { from } = useParams()
  const { user, update } = useUser()
  const [username, setUsername] = useState<string>('')
  const [isValidating, setIsValidating] = useState<boolean>(false)
  const nameInputRef = useRef<Input>(null)

  // check if we're coming from OTP
  const fromOtp = from === 'otp'

  // Debounce the username for availability checks
  const debouncedUsername = useDebounceValue(username.trim().toLowerCase(), 400)
  const isUsernameValid = checkUsernameValid(debouncedUsername)
  const isUsernameInvalid = debouncedUsername && !isUsernameValid

  // Query to check if username exists once debounced
  const [existingUser, availabilityStatus] = useQuery(
    userByUsername,
    { username: debouncedUsername },
    { enabled: isUsernameValid }
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

  const handleContinue = async () => {
    if (!user || !canContinue) return

    setIsValidating(true)
    try {
      await zero.mutate.userPublic.validateUsername(username.trim()).server
      await update({
        username: username.trim(),
      }).client
      router.replace('/avatar-setup')
    } catch (err) {
      console.error(err)
      showError(err, 'Invalid Username')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <OnboardingStepPageLayout
      title="Enter Username"
      description="Choose a unique username for your account."
      bottom={
        <ButtonSimple
          glass
          variant="outlined"
          size="large"
          pressStyle={{
            scale: 0.97,
            bg: '$color2',
          }}
          hoverStyle={{
            bg: '$color2',
          }}
          onPress={handleContinue}
          disabled={!canContinue || isValidating}
        >
          {isValidating ? 'Validating...' : 'Next'}
        </ButtonSimple>
      }
    >
      <YStack gap="$2">
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

          <XStack marginEnd={16}>
            {isCheckingAvailability ? (
              <Spinner size="small" color="$color10" />
            ) : isAvailable ? (
              <CheckIcon size={18} color="$green10" />
            ) : isUsernameInvalid || isUnavailable ? (
              <XIcon size={18} color="$red10" />
            ) : null}
          </XStack>
        </XStack>

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
