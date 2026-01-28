import { Paragraph, Progress, XStack, YStack } from 'tamagui'

import { Avatar } from '../avatars/Avatar'
import { Button } from '../buttons/Button'
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
  const { viewProps, uploads, handleFileChange, dropOverlay } = useDropArea({
    active: dropActive,
    onDropped: (uploads) => {
      if (uploads[0]?.url) {
        onChangeImage(uploads[0].url)
      }
    },
  })

  const latestUpload = uploads[uploads.length - 1]
  const uploadUrl = latestUpload?.url
  const progress = latestUpload?.progress
  const errorMessage = latestUpload?.error
  const image = uploadUrl || currentImage || ''

  return (
    <XStack gap="$3" items="center" position="relative" {...viewProps}>
      <Avatar key={image} size={100} image={image} />

      {dropOverlay}
      <XStack gap="$2" position="absolute" b={0} r={0} z={999}>
        <label htmlFor={id}>
          <input
            style={{ display: 'none' }}
            type="file"
            id={id}
            name="file"
            accept=".jpg,.jpeg,.png,.gif,.webp"
            onChange={handleFileChange}
          />
          <Button size="small" render="span" bg="$background">
            Pick
          </Button>
        </label>
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
