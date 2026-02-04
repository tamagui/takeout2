import { router, useBlocker } from 'one'
import { Keyboard } from 'react-native'
import { isWeb, Spinner, View, XStack, YStack } from 'tamagui'

import { useProfileEdit } from '~/features/user/useProfileEdit'
import { Button } from '~/interface/buttons/Button'
import { Dialog } from '~/interface/dialogs/Dialog'
import { Input } from '~/interface/forms/Input'
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
    await saveProfile()
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
          <Button onPress={() => blocker.reset?.()}>Stay</Button>
          <Button variant="action" onPress={handleDiscard}>
            Discard
          </Button>
        </XStack>
      </Dialog>

      <PageLayout>
        <View
          flex={1}
          flexBasis="auto"
          $platform-native={{
            px: '$4',
          }}
        >
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            bottomOffset={100}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
          >
            <YStack pt="$3" gap="$3" width="100%" maxW={400} self="center" select="none">
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
              {isWeb && (
                <Button
                  glass
                  glassTint={!canSave ? 'transparent' : 'darkslateblue'}
                  size="large"
                  onPress={handleSave}
                  disabled={!canSave}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </YStack>
          </KeyboardAwareScrollView>

          {!isWeb && (
            <KeyboardStickyFooter openedOffset={-10}>
              <Button
                theme="accent"
                glass
                size="large"
                onPress={handleSave}
                disabled={!canSave}
                opacity={!canSave ? 0.5 : 1}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </KeyboardStickyFooter>
          )}
        </View>
      </PageLayout>
    </>
  )
}
