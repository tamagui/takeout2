import { useState } from 'react'
import { isWeb, Paragraph, Progress, XStack, YStack } from 'tamagui'
import { Avatar } from '../avatars/Avatar'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { PencilSimpleIcon } from '../icons/phosphor/PencilSimpleIcon'
import { useDropArea } from './DragDropFile'

// conditionally import image picker for native
let pickImageFromLibrary: any

if (!isWeb) {
  const picker = require('~/helpers/media/imagePicker')
  pickImageFromLibrary = picker.pickImageFromLibrary
}

export const AvatarUpload = ({
  id,
  dropActive,
  originalImage,
  currentImage,
  onChangeImage,
}: {
  id: string
  dropActive: boolean
  originalImage?: string
  currentImage?: string
  onChangeImage: (url: string) => void
}) => {
  const [localImageUri, setLocalImageUri] = useState<string | null>(null)

  const { viewProps, uploads, handleFileChange, dropOverlay, clear } = useDropArea({
    active: dropActive,
    onDropped: (uploads) => {
      if (uploads[0]?.url) {
        onChangeImage(uploads[0].url)
      }
    },
  })

  // handler for native image picker
  const handleNativeImagePick = async () => {
    if (!pickImageFromLibrary) return

    const imageResult = await pickImageFromLibrary(true) // allowsEditing = true

    if (imageResult && !imageResult.canceled && imageResult.assets?.[0]) {
      const asset = imageResult.assets[0]
      setLocalImageUri(asset.uri)

      // create a pseudo-file object for native
      const pseudoFile = {
        uri: asset.uri,
        name: asset.fileName || `avatar-${Date.now()}.jpg`,
        type: asset.mimeType || asset.type || 'image/jpeg',
        size: asset.fileSize || 0,
        lastModified: Date.now(),
      } as any

      // create a mock event for the file change handler
      const event = {
        target: {
          files: [pseudoFile],
        },
      } as any
      handleFileChange(event)
    }
  }

  const latestUpload = uploads[uploads.length - 1]
  const uploadUrl = latestUpload?.url
  const progress = latestUpload?.progress
  const errorMessage = latestUpload?.error
  const image = uploadUrl || localImageUri || currentImage || ''

  return (
    <XStack gap="$3" items="center" {...viewProps}>
      <Avatar key={image} size={100} image={image} />

      {isWeb && dropOverlay}
      <XStack gap="$2" position="absolute" b={0} r={0}>
        {isWeb ? (
          <label htmlFor={id}>
            <input
              style={{ display: 'none' }}
              type="file"
              id={id}
              name="file"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileChange}
            />
            <ButtonSimple active size="small" tag="span">
              Pick
            </ButtonSimple>
          </label>
        ) : (
          <ButtonSimple
            glass
            circular
            active
            size="medium"
            onPress={handleNativeImagePick}
            icon={<PencilSimpleIcon size={16} color="$color10" />}
          />
        )}
      </XStack>
      <YStack>
        {!!(progress && progress !== 100) && (
          <Progress mt="$2" value={progress} bg="$color2">
            <Progress.Indicator borderColor="$color7" animation="bouncy" />
          </Progress>
        )}

        {!!errorMessage && <Paragraph theme="red">{errorMessage}</Paragraph>}
      </YStack>
    </XStack>
  )
}
