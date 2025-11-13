import { Separator, SizableText, Spinner, XStack, YStack } from 'tamagui'
import { useProfileEdit } from '~/features/user/useProfileEdit'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Input } from '~/interface/forms/Input'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { AvatarUpload } from '~/interface/upload/AvatarUpload'

export const UserProfileEditPopover = () => {
  const {
    user,
    username,
    name,
    isSaving,
    isCheckingAvailability,
    isAvailable,
    isUnavailable,
    isUsernameInvalid,
    canSave,
    debouncedUsername,
    handleAvatarUpload,
    handleSave,
    handleNameChange,
    handleUsernameChange,
  } = useProfileEdit()

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
