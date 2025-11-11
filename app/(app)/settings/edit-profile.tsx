import { useNavigation } from '@react-navigation/native'
import { router } from 'one'
import { useEffect, useState } from 'react'
import { Alert, Keyboard } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Spinner, useDebounceValue, View, XStack, YStack } from 'tamagui'
import { userByUsername } from '~/data/queries/user'
import { useUser } from '~/features/user/useUser'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { showError } from '~/interface/dialogs/actions'
import { Input } from '~/interface/forms/Input'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { KeyboardStickyFooter } from '~/interface/keyboard/KeyboardStickyFooter'
import { MediumText, TinyText } from '~/interface/text/Body'
import { showToast } from '~/interface/toast/helpers'
import { AvatarUpload } from '~/interface/upload/AvatarUpload'
import { useQuery } from '~/zero/client'

function checkUsernameValid(username: string) {
  if (username.length < 3) return false
  if (!username.match(/^[a-z][a-z0-9_]+$/)) return false
  return true
}

export const ProfileEditPage = () => {
  const { user, update } = useUser()
  const navigation = useNavigation()
  const [isSaving, setIsSaving] = useState<boolean>(false)

  const [username, setUsername] = useState<string>(user?.username || '')
  const [name, setName] = useState<string>(user?.name || '')
  const [isUsernameBlocked, setIsUsernameBlocked] = useState<boolean>(false)

  // Debounce username for availability check
  const lowernameUsername = username.trim().toLowerCase()
  const debouncedUsername = useDebounceValue(lowernameUsername)
  const isUsernameValid = checkUsernameValid(debouncedUsername)
  const isUsernameInvalid = (debouncedUsername && !isUsernameValid) || isUsernameBlocked
  // Query to check if username exists
  const [existingUser, availabilityStatus] = useQuery(
    userByUsername,
    { username: debouncedUsername },
    {
      enabled: isUsernameValid && debouncedUsername !== user?.username,
    }
  )

  const handleAvatarUpload = async (url: string) => {
    if (!user?.id) return
    update({ image: url })
  }

  const handleAvatarReset = () => {
    if (!user?.id) return
    // reset to empty string or original image if you want to clear the avatar
    update({ image: '' })
  }

  // Determine availability states
  const trimmedUsername = username.trim().toLowerCase()
  const isCheckingAvailability =
    (isUsernameValid && trimmedUsername !== debouncedUsername) ||
    (isUsernameValid &&
      debouncedUsername !== user?.username &&
      availabilityStatus.type !== 'complete')

  const isAvailable =
    debouncedUsername === user?.username || // current username is always available
    (isUsernameValid && availabilityStatus.type === 'complete' && !existingUser)

  const isUnavailable =
    isUsernameValid &&
    debouncedUsername !== user?.username &&
    availabilityStatus.type === 'complete' &&
    !!existingUser

  const hasUnsavedChanges =
    trimmedUsername !== user?.username || name.trim() !== user?.name

  const canSave =
    isUsernameValid && !isCheckingAvailability && !isUnavailable && hasUnsavedChanges

  const handleSave = async () => {
    if (isSaving) return

    setIsSaving(true)

    Keyboard.dismiss()

    try {
      await update({
        username: username.trim(),
        name: name.trim(),
      }).server

      showToast('Profile updated', {
        type: 'success',
      })

      router.back()
    } catch (err: any) {
      if (err.details === 'Blocked username') {
        setIsUsernameBlocked(true)
      } else {
        showError(err)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleNameChange = (text: string) => {
    if (text.length <= 40) {
      setName(text)
    }
  }

  const handleUsernameChange = (text: string) => {
    if (text.length <= 30) {
      setUsername(text)
      if (isUsernameBlocked) {
        setIsUsernameBlocked(false)
      }
    }
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Allow navigation if saving or no unsaved changes
      if (isSaving || !hasUnsavedChanges) {
        return
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault()

      // Prompt the user
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: "Don't leave", style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      )
    })

    return unsubscribe
  }, [navigation, hasUnsavedChanges, isSaving])

  return (
    <View flex={1}>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        bottomOffset={100}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <YStack px="$3" pt="$3" gap="$3">
          <YStack py="$3" justify="center" items="center">
            <AvatarUpload
              id="avatar"
              dropActive={false}
              originalImage={user?.image || undefined}
              currentImage={user?.image || undefined}
              onChangeImage={handleAvatarUpload}
            />
          </YStack>
          <YStack>
            <XStack justify="space-between" items="center" mb="$2">
              <MediumText fontWeight="500" color="$color11">
                Name
              </MediumText>
              <MediumText color="$color9">{name.length}/40</MediumText>
            </XStack>
            <Input
              width="100%"
              placeholder="John Doe"
              value={name}
              onChangeText={handleNameChange}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </YStack>
          <YStack>
            <XStack justify="space-between" items="center" mb="$2">
              <MediumText fontWeight="500" color="$color11">
                Username
              </MediumText>
              <MediumText color="$color9">{username.length}/30</MediumText>
            </XStack>
            <XStack items="center" position="relative">
              <Input
                width="100%"
                placeholder="johndoe"
                value={username}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
                autoCorrect={false}
                pr="$10"
              />
              <XStack position="absolute" end={0} marginEnd={12}>
                {isCheckingAvailability ? (
                  <Spinner size="small" color="$color10" />
                ) : isUsernameInvalid || isUnavailable ? (
                  <XIcon size={18} color="$red10" />
                ) : isAvailable && debouncedUsername ? (
                  <CheckIcon size={18} color="$green10" />
                ) : null}
              </XStack>
            </XStack>
            {isUnavailable && !isCheckingAvailability ? (
              <TinyText mt="$1" color="$red10">
                Username is not available
              </TinyText>
            ) : isUsernameInvalid ? (
              <TinyText mt="$1" color="$red10">
                Must be 3+ chars, start with letter, only letters/numbers/_
              </TinyText>
            ) : null}
          </YStack>
        </YStack>
      </KeyboardAwareScrollView>

      <KeyboardStickyFooter>
        <ButtonSimple glass size="large" onPress={handleSave} disabled={!canSave}>
          {isSaving ? 'Saving...' : 'Save'}
        </ButtonSimple>
      </KeyboardStickyFooter>
    </View>
  )
}
