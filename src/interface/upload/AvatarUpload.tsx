import { Trash, X } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { isWeb, Paragraph, Progress, XStack, YStack } from 'tamagui'
import { generateRandomAvatar } from '~/helpers/image/generateRandomAvatar'
import { Avatar } from '../avatars/Avatar'
import { ButtonSimple } from '../buttons/ButtonSimple'
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
  const [rarity, setRarity] = useState<number | null>(null)

  const { viewProps, uploads, handleFileChange, dropOverlay, clear } = useDropArea({
    active: dropActive,
    onDropped: (uploads) => {
      if (uploads[0]?.url) {
        onChangeImage(uploads[0].url)
        setRarity(null)
      }
    },
  })

  const latestUpload = uploads[uploads.length - 1]
  const uploadUrl = latestUpload?.url
  const progress = latestUpload?.progress
  const errorMessage = latestUpload?.error
  const image = uploadUrl || currentImage || ''
  const isModified = image !== originalImage && !!originalImage

  return (
    <XStack gap="$3" items="center" {...viewProps}>
      <Avatar key={image} size={64} image={image} />

      {isWeb && dropOverlay}

      {isWeb && (
        <YStack>
          <XStack gap="$2">
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

            <YStack position="relative">
              <ButtonSimple
                size="small"
                onPress={() => {
                  const result = generateRandomAvatar(256)
                  onChangeImage(result.dataUrl)
                  setRarity(result.rarity)
                }}
              >
                Random
              </ButtonSimple>
              {rarity !== null && (
                <YStack
                  position="absolute"
                  y={32}
                  width="100%"
                  pointerEvents="none"
                  items="center"
                >
                  <Paragraph fontSize={10} opacity={0.6}>
                    Rarity: {rarity}
                  </Paragraph>
                </YStack>
              )}
            </YStack>
          </XStack>

          {!!(progress && progress !== 100) && (
            <Progress mt="$2" value={progress} bg="$color2">
              <Progress.Indicator borderColor="$color7" animation="bouncy" />
            </Progress>
          )}

          {!!errorMessage && <Paragraph theme="red">{errorMessage}</Paragraph>}
        </YStack>
      )}

      {isModified ? (
        <ButtonSimple
          size="small"
          tooltip="Reset to original"
          aria-label="Reset to original"
          icon={X}
          onPress={() => {
            clear()
            onChangeImage?.(originalImage || '')
            setRarity(null)
          }}
        />
      ) : (
        !!image && (
          <ButtonSimple
            theme="red"
            size="small"
            tooltip="Remove"
            aria-label="Remove"
            icon={Trash}
            onPress={() => {
              clear()
              onChangeImage?.('')
              setRarity(null)
            }}
          />
        )
      )}
    </XStack>
  )
}
