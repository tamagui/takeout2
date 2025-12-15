import { useEffect, useRef, useState } from 'react'
import { Circle, isWeb, SizableText, Spinner, XStack, YStack } from 'tamagui'

import { OnboardingStepPageLayout } from '~/features/user/ui/OnboardingStepPageLayout'
import { useUser } from '~/features/user/useUser'
import { isDemoMode } from '~/helpers/isDemoMode'
import { pickImageFromLibrary, takePhotoWithCamera } from '~/helpers/media/imagePicker'
import { useGoBackToHome } from '~/hooks/useGoBackToHome'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Pressable } from '~/interface/buttons/Pressable'
import { showError } from '~/interface/dialogs/actions'
import { CameraIcon } from '~/interface/icons/phosphor/CameraIcon'
import { CircleDashedIcon } from '~/interface/icons/phosphor/CircleDashedIcon'
import { ImageIcon } from '~/interface/icons/phosphor/ImageIcon'
import { PencilSimpleIcon } from '~/interface/icons/phosphor/PencilSimpleIcon'
import { Image } from '~/interface/image/Image'
import { ListItem } from '~/interface/lists/ListItem'
import { Sheet } from '~/interface/sheet/Sheet'
import { showToast } from '~/interface/toast/helpers'
import { useUploadFiles } from '~/interface/upload/uploadFile'
import { zero } from '~/zero/client'

const MAX_IMAGE_SIZE = 600
const IMAGE_QUALITY = 0.9
const IMAGE_SIZE = isWeb ? 100 : 220
const PENCIL_SIZE = isWeb ? 28 : 52

export const AvatarSetupPage = () => {
  const goBackToHome = useGoBackToHome()
  const [localImageUri, setLocalImageUri] = useState<string | null>(null)
  const { user, update } = useUser()

  const sheetRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { uploads, handleUpload } = useUploadFiles({
    onChange: async (uploads) => {
      if (uploads[0]?.url && user?.id) {
        try {
          await update({
            image: uploads[0].url,
          })
        } catch (error) {
          console.info('Failed to update user avatar:', error)
          showError(error)
        }
      }
    },
    resize: {
      maxWidth: MAX_IMAGE_SIZE,
      maxHeight: MAX_IMAGE_SIZE,
      quality: IMAGE_QUALITY,
      maxSizeInBytes: 1000 * 1024,
    },
  })

  const latestUpload = uploads[uploads.length - 1]
  const progress = latestUpload?.progress
  const errorMessage = latestUpload?.error
  const isUploading = latestUpload?.status === 'uploading'
  const uploadedUrl = latestUpload?.url

  useEffect(() => {
    if (errorMessage) {
      showToast(errorMessage, {
        title: 'Error',
        description: errorMessage,
      })
    }
  }, [errorMessage])

  useEffect(() => {
    if (uploadedUrl) {
      setLocalImageUri(uploadedUrl)
    }
  }, [uploadedUrl])

  const handleWebFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLocalImageUri(URL.createObjectURL(file))
      handleUpload([file])
    }
  }

  const handleOpenSheet = () => {
    if (isWeb) {
      fileInputRef.current?.click()
    } else {
      sheetRef.current?.expand()
    }
  }

  const handleChooseImage = async (type: 'camera' | 'library') => {
    sheetRef.current?.collapse()

    const imageResult =
      type === 'camera' ? await takePhotoWithCamera() : await pickImageFromLibrary()

    if (imageResult && !imageResult.canceled && imageResult.assets?.[0]) {
      const asset = imageResult.assets[0]
      setLocalImageUri(asset.uri)

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

  const avatarOptions = [
    { icon: CameraIcon, label: 'Take Photo', onPress: () => handleChooseImage('camera') },
    {
      icon: ImageIcon,
      label: 'Choose Image',
      onPress: () => handleChooseImage('library'),
    },
  ]

  return (
    <>
      {isWeb && (
        <input
          ref={fileInputRef as any}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleWebFileChange}
        />
      )}

      <OnboardingStepPageLayout
        title="Set Avatar"
        Icon={CameraIcon}
        description="Finally, let's choose an avatar for your profile."
        bottom={
          <XStack gap="$3" justify="center">
            {isDemoMode && (
              <ButtonSimple
                glass
                size="large"
                data-testid="skip-onboarding"
                onPress={async () => {
                  if (user) {
                    await zero.mutate.userPublic.finishOnboarding()
                  }
                  goBackToHome()
                }}
              >
                Skip
              </ButtonSimple>
            )}
            <ButtonSimple
              glass
              size="large"
              pressStyle={{
                scale: 0.97,
                opacity: 0.9,
              }}
              onPress={async () => {
                if (user) {
                  await zero.mutate.userPublic.finishOnboarding()
                }
                goBackToHome()
              }}
              disabled={!localImageUri || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Next'}
            </ButtonSimple>
          </XStack>
        }
      >
        <YStack items="center" mt="$2">
          {!localImageUri && (
            <YStack mb="$4">
              <YStack items="center" px="$4" py="$2" bg="$color2" rounded="$6">
                <SizableText color="$color11">
                  {isWeb ? 'Click to add an avatar' : 'Tap to add an avatar'}
                </SizableText>
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
            <Pressable onPress={handleOpenSheet} disabled={isUploading}>
              <YStack
                animation="bouncy"
                scale={localImageUri ? 1 : 0.9}
                overflow="hidden"
                rounded={200}
                borderColor="$color5"
                position="relative"
              >
                {localImageUri ? (
                  <Image
                    src={localImageUri}
                    width={IMAGE_SIZE}
                    height={IMAGE_SIZE}
                    objectFit="cover"
                  />
                ) : (
                  <CircleDashedIcon size={IMAGE_SIZE} color="$color5" />
                )}
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
                <Circle size={PENCIL_SIZE} bg="$color" items="center" justify="center">
                  <PencilSimpleIcon size={PENCIL_SIZE / 2} color="$color2" />
                </Circle>
              </Pressable>
            )}
          </YStack>

          {isWeb && progress && progress < 100 && (
            <YStack mt="$4" width={220}>
              <SizableText size="$2" color="$color10" text="center">
                Uploading: {progress}%
              </SizableText>
            </YStack>
          )}
        </YStack>
      </OnboardingStepPageLayout>

      {!isWeb && (
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
      )}
    </>
  )
}
