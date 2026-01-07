import { useNavigation } from '@react-navigation/native'
import { router } from 'one'
import { useEffect } from 'react'
import { Alert, Keyboard } from 'react-native'
import { Spinner, View, XStack, YStack } from 'tamagui'

import { useProfileEdit } from '~/features/user/useProfileEdit'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Input } from '~/interface/forms/Input'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { KeyboardAwareScrollView } from '~/interface/keyboard/KeyboardAwareScrollView'
import { KeyboardStickyFooter } from '~/interface/keyboard/KeyboardStickyFooter'
import { Text } from '~/interface/text/Text'
import { AvatarUpload } from '~/interface/upload/AvatarUpload'

export const ProfileEditPage = () => {
  const navigation = useNavigation()
  const {
    user,
    username,
    name,
    isSaving,
    isCheckingAvailability,
    isAvailable,
    isUnavailable,
    isUsernameInvalid,
    hasUnsavedChanges,
    canSave,
    debouncedUsername,
    handleAvatarUpload,
    handleSave: saveProfile,
    handleNameChange,
    handleUsernameChange,
  } = useProfileEdit()

  const handleSave = async () => {
    Keyboard.dismiss()
    const success = await saveProfile()
    if (success) {
      router.back()
    }
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isSaving || !hasUnsavedChanges) {
        return
      }

      e.preventDefault()

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
    <View flex={1} flexBasis="auto">
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        bottomOffset={100}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <YStack px="$3" pt="$3" gap="$3" $platform-web={{ width: 400, self: 'center' }}>
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
              <Text size="$3" fontWeight="500" color="$color11">
                Name
              </Text>
              <Text size="$3" color="$color9">
                {name.length}/40
              </Text>
            </XStack>
            <Input
              width="100%"
              placeholder="John Doe"
              value={name}
              onChange={(e) => handleNameChange((e.target as HTMLInputElement).value)}
              autoCapitalize="words"
              autoCorrect="off"
            />
          </YStack>
          <YStack>
            <XStack justify="space-between" items="center" mb="$2">
              <Text size="$3" fontWeight="500" color="$color11">
                Username
              </Text>
              <Text size="$3" color="$color9">
                {username.length}/30
              </Text>
            </XStack>
            <XStack items="center" position="relative">
              <Input
                width="100%"
                placeholder="johndoe"
                value={username}
                onChange={(e) => handleUsernameChange((e.target as HTMLInputElement).value)}
                autoCapitalize="none"
                autoCorrect="off"
                pr="$10"
              />
              <XStack position="absolute" r="$4">
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
              <Text size="$2" mt="$1" color="$red10">
                Username is not available
              </Text>
            ) : isUsernameInvalid ? (
              <Text size="$2" mt="$1" color="$red10">
                Must be 3+ chars, start with letter, only letters/numbers/_
              </Text>
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
