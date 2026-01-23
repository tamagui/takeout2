import { router, useBlocker } from 'one'
import { Keyboard } from 'react-native'
import { isWeb, Spinner, View, XStack, YStack } from 'tamagui'

import { useProfileEdit } from '~/features/user/useProfileEdit'
import { ButtonAction } from '~/interface/buttons/ButtonAction'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Dialog } from '~/interface/dialogs/Dialog'
import { Input } from '~/interface/forms/Input'
import { AnimatedBlurHeader } from '~/interface/headers/AnimatedBlurHeader'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { KeyboardAwareScrollView } from '~/interface/keyboard/KeyboardAwareScrollView'
import { KeyboardStickyFooter } from '~/interface/keyboard/KeyboardStickyFooter'
import { PageLayout } from '~/interface/pages/PageLayout'
import { Text } from '~/interface/text/Text'
import { AvatarUpload } from '~/interface/upload/AvatarUpload'

export const ProfileEditPage = () => {
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

  const blocker = useBlocker(!isSaving && hasUnsavedChanges)

  const handleDiscard = () => {
    const destination = blocker.location as any
    blocker.proceed?.()
    // TODO: fix this on ONE
    if (isWeb && destination) {
      router.push(destination)
    } else {
      router.back()
    }
  }

  return (
    <>
      <Dialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open) blocker.reset?.()
        }}
        minH={200}
      >
        <Dialog.Header
          title="Discard changes?"
          description="You have unsaved changes. Are you sure you want to discard them?"
        />
        <XStack justify="flex-end" gap="$2">
          <ButtonSimple onPress={() => blocker.reset?.()}>Stay</ButtonSimple>
          <ButtonAction onPress={handleDiscard}>Discard</ButtonAction>
        </XStack>
      </Dialog>

      <PageLayout>
        {isWeb && (
          <View display="flex" $md={{ display: 'none' }}>
            <AnimatedBlurHeader title="Edit Profile" />
          </View>
        )}
        <View
          flex={1}
          flexBasis="auto"
          transition="200ms"
          enterStyle={{ opacity: 0, y: 10 }}
          exitStyle={{ opacity: 0, y: -10 }}
        >
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            bottomOffset={100}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
          >
            <YStack pt="$3" gap="$3" $md={{ width: 400, self: 'center' }}>
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
                  glass
                  placeholder="Nate"
                  value={name}
                  onChangeText={handleNameChange}
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
                <View position="relative" justify="center">
                  <Input
                    width="100%"
                    glass
                    placeholder="johndoe"
                    value={username}
                    onChangeText={handleUsernameChange}
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
                </View>
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

          <KeyboardStickyFooter openedOffset={-10}>
            <ButtonSimple
              glass
              glassTint={!canSave ? 'transparent' : 'darkslateblue'}
              size="large"
              onPress={handleSave}
              disabled={!canSave}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </ButtonSimple>
          </KeyboardStickyFooter>
        </View>
      </PageLayout>
    </>
  )
}
