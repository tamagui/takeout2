import { useNavigation } from '@react-navigation/native'
import { router } from 'one'
import { useEffect, useState } from 'react'
import { Alert, Keyboard } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Spinner, useDebounceValue, View, XStack, YStack } from 'tamagui'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Input } from '~/interface/forms/Input'
import { TextArea } from '~/interface/forms/TextArea'
import { BasicHeader } from '~/interface/headers/BasicHeader'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { KeyboardStickyFooter } from '~/interface/keyboard/KeyboardStickyFooter'
import { MediumText, TinyText } from '~/interface/text/Body'
import { showToast } from '~/interface/toast/helpers'
import { AvatarUpload } from '~/interface/upload/AvatarUpload'
import { useQuery, zero } from '~/zero/client'
import { useUser } from '../user/useUser'

function checkUsernameValid(username: string) {
  if (username.length < 3) return false
  if (!username.match(/^[a-z][a-z0-9_]+$/)) return false
  return true
}

export const ProfileEditPage = () => {
  const { user, loading, update } = useUser()
  const navigation = useNavigation()
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Initialize with user values
  const [username, setUsername] = useState<string>(user?.username || '')
  const [name, setName] = useState<string>(user?.name || '')
  const [bio, setBio] = useState<string>(user?.bio || '')
  const [isUsernameBlocked, setIsUsernameBlocked] = useState<boolean>(false)

  // Debounce username for availability check
  const lowernameUsername = username.trim().toLowerCase()
  const debouncedUsername = useDebounceValue(lowernameUsername)
  const isUsernameValid = checkUsernameValid(debouncedUsername)
  const isUsernameInvalid = (debouncedUsername && !isUsernameValid) || isUsernameBlocked
  // Query to check if username exists
  const [existingUser, availabilityStatus] = useQuery(
    zero.query.userPublic.where('username', debouncedUsername).one(),
    {
      enabled: isUsernameValid && debouncedUsername !== user?.username,
    }
  )

  const handleAvatarUpload = async (url: string) => {
    if (!user?.id) return
    update({ image: url })
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
    trimmedUsername !== user?.username ||
    name.trim() !== user?.name ||
    bio.trim() !== (user?.bio || '')

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
        bio: bio.trim(),
      }).server

      showToast('Profile updated', {
        type: 'success',
      })

      router.back()
    } catch (err: any) {
      if (err.details === 'Blocked username') {
        setIsUsernameBlocked(true)
      } else {
        showToast('Invalid profile information.', {
          type: 'error',
        })
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

  const handleBioChange = (text: string) => {
    if (text.length <= 75) {
      setBio(text)
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
      <BasicHeader title="Edit Profile" BackIcon={CaretLeftIcon} />

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        bottomOffset={100}
        keyboardShouldPersistTaps="handled"
      >
        <YStack px="$3" pt="$3" gap="$3">
          <YStack py="$3" justify="center" items="center">
            <AvatarUpload currentImageUrl={user?.image} onUpload={handleAvatarUpload} />
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
          <YStack>
            <XStack justify="space-between" items="center" mb="$2">
              <MediumText fontWeight="500" color="$color11">
                Bio
              </MediumText>
              <MediumText color="$color9">{bio.length}/75</MediumText>
            </XStack>
            <TextArea
              width="100%"
              verticalAlign="top"
              placeholder="Tell us about yourself"
              value={bio}
              onChangeText={handleBioChange}
              maxLength={75}
              height={150}
              p="$3"
              bg="$color2"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$4"
              placeholderTextColor="$color10"
            />
          </YStack>
        </YStack>
      </KeyboardAwareScrollView>

      <KeyboardStickyFooter>
        <ButtonSimple
          onPress={handleSave}
          disabled={!canSave}
          variant={!canSave || isSaving ? 'default' : 'highlight'}
          loading={loading || isCheckingAvailability || isSaving}
        >
          Save
        </ButtonSimple>
      </KeyboardStickyFooter>
    </View>
  )
}
