import { useEffect, useRef, useState } from 'react'
import { Circle, SizableText, Spinner, YStack } from 'tamagui'
import { useOnboarding } from '~/features/onboarding/useOnboarding'
import { images } from '~/constants/images'
import { pickImageFromLibrary, takePhotoWithCamera } from '~/helpers/media/imagePicker'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Pressable } from '~/interface/buttons/Pressable'
import { CameraIcon } from '~/interface/icons/phosphor/CameraIcon'
import { ImageIcon } from '~/interface/icons/phosphor/ImageIcon'
import { PencilSimpleIcon } from '~/interface/icons/phosphor/PencilSimpleIcon'
import { Image } from '~/interface/image/Image'
import { ListItem } from '~/interface/lists/ListItem'
import { showErrorSheet } from '~/interface/sheet/errorSheetHelper'
import { Sheet, type SheetRef } from '~/interface/sheet/Sheet'
import { useUploadFiles } from '~/interface/upload/uploadFile'
import { useUser } from '../useUser'
import { OnboardingStepPageLayout } from './OnboardingStepPageLayout'

const MAX_IMAGE_SIZE = 600
const IMAGE_QUALITY = 0.9

export const AvatarSetupPage = () => {
  const [localImageUri, setLocalImageUri] = useState<string | null>(null)
  const { user, update } = useUser()

  const sheetRef = useRef<SheetRef>(null)

  const { uploads, handleUpload } = useUploadFiles({
    onChange: async (uploads) => {
      if (uploads[0]?.url && user?.id) {
        // update user profile with new avatar
        try {
          update({
            image: uploads[0].url,
          })
        } catch (error) {
          console.info('failed to update user avatar:', error)
          showErrorSheet({
            title: 'Error',
            description: 'Failed to update user avatar',
          })
        }
      }
    },
    resize: {
      maxWidth: MAX_IMAGE_SIZE,
      maxHeight: MAX_IMAGE_SIZE,
      quality: IMAGE_QUALITY,
      maxSizeInBytes: 1000 * 1024, // 1mb max for avatars
    },
  })

  const latestUpload = uploads[uploads.length - 1]
  const progress = latestUpload?.progress
  const errorMessage = latestUpload?.error
  const isUploading = latestUpload?.status === 'uploading'

  useEffect(() => {
    if (errorMessage) {
      showErrorSheet({
        title: 'Error',
        description: errorMessage,
      })
    }
  }, [errorMessage])

  const handleOpenSheet = () => {
    sheetRef.current?.expand()
  }

  const handleChooseImage = async (type: 'camera' | 'library') => {
    sheetRef.current?.collapse()

    const imageResult =
      type === 'camera' ? await takePhotoWithCamera() : await pickImageFromLibrary()

    if (imageResult && !imageResult.canceled && imageResult.assets?.[0]) {
      const asset = imageResult.assets[0]
      setLocalImageUri(asset.uri)

      // create a pseudo-File object for native
      // the useUploadFiles hook expects File objects
      // but we'll handle the native case in uploadFileData
      const pseudoFile = {
        uri: asset.uri,
        name: asset.fileName || `avatar-${Date.now()}.jpg`,
        type: asset.mimeType || asset.type || 'image/jpeg',
        size: asset.fileSize || 0,
        lastModified: Date.now(),
      } as any

      handleUpload([pseudoFile])
    }
  }

  const handleUseEmoji = () => {
    sheetRef.current?.collapse()
    // TODO: Implement emoji selection
    console.info('Use emoji selected')
  }

  const avatarOptions = [
    { icon: CameraIcon, label: 'Take Photo', onPress: () => handleChooseImage('camera') },
    {
      icon: ImageIcon,
      label: 'Choose Image',
      onPress: () => handleChooseImage('library'),
    },
    // TODO: Implement emoji selection
    // { icon: SmileyIcon, label: 'Use Emoji', onPress: handleUseEmoji },
  ]

  const { goToNextStep } = useOnboarding()

  return (
    <>
      <OnboardingStepPageLayout
        title="Set Avatar"
        Icon={CameraIcon}
        description="Finally, let's choose an avatar for your profile."
        bottom={
          <YStack gap="$5">
            <SizableText
              animation="200ms"
              opacity={localImageUri ? 0.6 : 0}
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
              size="$3"
              color="$color10"
              text="center"
            >
              You can always change your avatar later.
            </SizableText>
            <ButtonSimple
              size="large"
              onPress={goToNextStep}
              disabled={!localImageUri}
              theme={localImageUri ? 'accent' : undefined}
            >
              <ButtonSimple.Text>Next</ButtonSimple.Text>
            </ButtonSimple>
          </YStack>
        }
      >
        <YStack items="center" mt="$10">
          {!localImageUri && (
            <YStack mb="$4">
              <YStack items="center" px="$4" py="$2" bg="$color2" rounded="$6">
                <SizableText color="$color11">Tap to add an avatar</SizableText>
                <YStack
                  position="absolute"
                  b={-8}
                  width={0}
                  height={0}
                  borderLeftWidth={8}
                  borderRightWidth={8}
                  borderTopWidth={8}
                  borderLeftColor="transparent"
                  borderRightColor="transparent"
                  borderTopColor="$color2"
                />
              </YStack>
            </YStack>
          )}

          <YStack>
            <Pressable onPress={handleOpenSheet} disabled={localImageUri !== null}>
              <YStack
                animation="bouncy"
                scale={localImageUri ? 1 : 0.9}
                overflow="hidden"
                rounded={200}
                borderColor="$color5"
                position="relative"
              >
                {localImageUri ? (
                  <Image src={localImageUri} width={220} height={220} />
                ) : (
                  <Image src={images.avatarContainer} width={220} height={220} />
                )}

                {/* Progress indicator in the middle of avatar */}
                {isUploading && (
                  <YStack
                    position="absolute"
                    t={0}
                    l={0}
                    r={0}
                    b={0}
                    bg="$background"
                    opacity={0.8}
                    items="center"
                    justify="center"
                    z={2}
                  >
                    <Spinner size="small" />
                  </YStack>
                )}
              </YStack>
            </Pressable>
            {localImageUri && !isUploading && (
              <Pressable position="absolute" b={0} r={0} onPress={handleOpenSheet}>
                <Circle size={52} bg="$color" items="center" justify="center">
                  <PencilSimpleIcon size={28} color="$color2" />
                </Circle>
              </Pressable>
            )}
          </YStack>
        </YStack>
      </OnboardingStepPageLayout>

      {/* Avatar Selection Sheet */}
      <Sheet ref={sheetRef} title="Select Option">
        <YStack gap="$2">
          {avatarOptions.map(({ icon: Icon, label, onPress }) => (
            <ListItem
              key={label}
              onPress={onPress}
              size="large"
              bg="$color3"
              pressStyle={{ bg: '$color2' }}
              height={50}
            >
              <Icon size={22} color="$color10" />
              <ListItem.Text fontWeight="600" color="$color">
                {label}
              </ListItem.Text>
            </ListItem>
          ))}
        </YStack>
      </Sheet>
    </>
  )
}
