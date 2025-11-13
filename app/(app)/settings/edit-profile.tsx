import { useNavigation } from '@react-navigation/native'
import { router } from 'one'
import { useEffect } from 'react'
import { Alert, Keyboard } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Spinner, View, XStack, YStack } from 'tamagui'
import { useProfileEdit } from '~/features/user/useProfileEdit'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Input } from '~/interface/forms/Input'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { KeyboardStickyFooter } from '~/interface/keyboard/KeyboardStickyFooter'
import { MediumText, TinyText } from '~/interface/text/Body'
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
