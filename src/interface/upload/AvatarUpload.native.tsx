import { useState } from 'react'
import { Paragraph, Progress, XStack, YStack } from 'tamagui'

import { pickImageFromLibrary } from '~/helpers/media/imagePicker'

import { Avatar } from '../avatars/Avatar'
import { Button } from '../buttons/Button'
import { PencilSimpleIcon } from '../icons/phosphor/PencilSimpleIcon'
import { useDropArea } from './DragDropFile'

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

  const { viewProps, uploads, handleFileChange, clear } = useDropArea({
    active: dropActive,
    onDropped: (uploads) => {
      if (uploads[0]?.url) {
        onChangeImage(uploads[0].url)
      }
    },
  })

  const handleNativeImagePick = async () => {
    const imageResult = await pickImageFromLibrary(true)

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

      <XStack gap="$2" position="absolute" b={0} r={0}>
        <Button
          glass
          circular
          active
          size="medium"
          onPress={handleNativeImagePick}
          icon={<PencilSimpleIcon size={16} color="$color10" />}
        />
      </XStack>
      <YStack>
        {!!(progress && progress !== 100) && (
          <Progress mt="$2" value={progress} bg="$color2">
            <Progress.Indicator borderColor="$color7" transition="bouncy" />
          </Progress>
        )}

        {!!errorMessage && <Paragraph theme="red">{errorMessage}</Paragraph>}
      </YStack>
    </XStack>
  )
}
