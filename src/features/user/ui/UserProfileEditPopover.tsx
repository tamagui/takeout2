import { useState } from 'react'
import {
  Separator,
  SizableText,
  Spinner,
  useDebounceValue,
  XStack,
  YStack,
} from 'tamagui'
import { userByUsername } from '~/data/queries/user'
import { useUser } from '~/features/user/useUser'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Input } from '~/interface/forms/Input'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { showToast } from '~/interface/toast/helpers'
import { AvatarUpload } from '~/interface/upload/AvatarUpload'
import { useQuery } from '~/zero/client'

function checkUsernameValid(username: string) {
  if (username.length < 3) return false
  if (!username.match(/^[a-z][a-z0-9_]+$/)) return false
  return true
}

export const UserProfileEditPopover = () => {
  const { user, update } = useUser()
  const [isSaving, setIsSaving] = useState(false)
  const [username, setUsername] = useState(user?.username || '')
  const [name, setName] = useState(user?.name || '')
  const [isUsernameBlocked, setIsUsernameBlocked] = useState(false)

  // Debounce username for availability check
  const lowernameUsername = username.trim().toLowerCase()
  const debouncedUsername = useDebounceValue(lowernameUsername, 500)
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
    try {
      await update({ image: url }).server
      showToast('Avatar updated', { type: 'success' })
    } catch (err) {
      showToast('Failed to update avatar', { type: 'error' })
    }
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
    if (isSaving || !canSave) return

    setIsSaving(true)

    try {
      await update({
        username: username.trim(),
        name: name.trim(),
      }).server

      showToast('Profile updated', { type: 'success' })
    } catch (err: any) {
      if (err.details === 'Blocked username') {
        setIsUsernameBlocked(true)
      } else {
        showToast('Failed to update profile', { type: 'error' })
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

  return (
    <YStack p="$4" gap="$3" minW={320}>
      {/* Avatar Upload */}
      <YStack items="center" py="$2">
        <AvatarUpload
          id="popover-avatar"
          dropActive={false}
          originalImage={user?.image || undefined}
          currentImage={user?.image || undefined}
          onChangeImage={handleAvatarUpload}
        />
      </YStack>

      <Separator />

      {/* Name Input */}
      <YStack gap="$2">
        <XStack justify="space-between" items="center">
          <SizableText size="$2" fontWeight="500" color="$color11">
            Name
          </SizableText>
          <SizableText size="$1" color="$color9">
            {name.length}/40
          </SizableText>
        </XStack>
        <Input
          size="$3"
          placeholder="John Doe"
          value={name}
          onChangeText={handleNameChange}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </YStack>

      {/* Username Input */}
      <YStack gap="$2">
        <XStack justify="space-between" items="center">
          <SizableText size="$2" fontWeight="500" color="$color11">
            Username
          </SizableText>
          <SizableText size="$1" color="$color9">
            {username.length}/30
          </SizableText>
        </XStack>
        <XStack items="center" position="relative">
          <Input
            size="$3"
            flex={1}
            placeholder="johndoe"
            value={username}
            onChangeText={handleUsernameChange}
            autoCapitalize="none"
            autoCorrect={false}
            pr="$8"
          />
          <XStack position="absolute" r="$2">
            {isCheckingAvailability ? (
              <Spinner size="small" color="$color10" />
            ) : isUsernameInvalid || isUnavailable ? (
              <XIcon size={16} color="$red10" />
            ) : isAvailable && debouncedUsername ? (
              <CheckIcon size={16} color="$green10" />
            ) : null}
          </XStack>
        </XStack>
        {isUnavailable && !isCheckingAvailability ? (
          <SizableText size="$1" color="$red10">
            Username is not available
          </SizableText>
        ) : isUsernameInvalid ? (
          <SizableText size="$1" color="$red10">
            Must be 3+ chars, start with letter, only letters/numbers/_
          </SizableText>
        ) : null}
      </YStack>

      <Separator />

      {/* Save Button */}
      <ButtonSimple
        size="small"
        variant="default"
        onPress={handleSave}
        disabled={!canSave || isSaving}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </ButtonSimple>
    </YStack>
  )
}
