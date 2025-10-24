import { Image } from '~/interface/image/Image'
import { Download, Expand, Play } from '@tamagui/lucide-icons'
import { SizableText, Square, YStack } from 'tamagui'
import {
  formatFileSize,
  getFileIcon,
  isImageFile,
  isVideoFile,
} from '~/interface/upload/helpers'
import { Video } from '~/interface/video/Video'
import { downloadFromUrl } from '~/helpers/tauri/download'
import type { AttachmentItemMediaProps } from './types'
import { getAttachmentSize } from './constants'

export const AttachmentItemMedia = (props: AttachmentItemMediaProps) => {
  const { attachment, isInput = false } = props
  const size = getAttachmentSize(props)
  const isImage = Boolean(attachment.url && isImageFile(attachment.url))
  const isVideo = Boolean(attachment.url && isVideoFile(attachment.url))

  if (isImage && attachment.url) {
    return <Image src={attachment.url} width={size} height={size} objectFit="contain" />
  }

  if (isVideo && attachment.url) {
    return (
      <YStack width={size} height={size} position="relative">
        <Video
          src={attachment.url}
          poster={attachment.thumbnail || undefined}
          width={size}
          height={size}
          objectFit="contain"
          controls={false}
          preload="metadata"
        />
        {!isInput && (
          <>
            <YStack
              position="absolute"
              inset={0}
              items="center"
              justify="center"
              pointerEvents="none"
            >
              <Square
                size={60}
                bg="$color02"
                rounded="$10"
                items="center"
                justify="center"
                opacity={0.9}
              >
                <Play size={30} color="$color12" fill="$color12" />
              </Square>
            </YStack>
            <Square
              position="absolute"
              t="$2"
              r="$2"
              size={32}
              bg="$color02"
              rounded="$2"
              items="center"
              justify="center"
              opacity={0.9}
              pointerEvents="none"
            >
              <Expand size={16} color="$color12" />
            </Square>
          </>
        )}
      </YStack>
    )
  }

  if (attachment.url) {
    const fileName = attachment.url.split('/').pop() || 'file'

    return (
      <YStack
        items="center"
        justify="center"
        width={size}
        height={size}
        gap="$2"
        p="$3"
        overflow="hidden"
        position="relative"
        cursor="pointer"
        hoverStyle={{
          opacity: 0.9,
        }}
        onPress={(e) => {
          e.stopPropagation()
          downloadFromUrl(attachment.url!, fileName)
        }}
      >
        {getFileIcon(attachment.url, Math.min(size * 0.4, 48))}
        <YStack maxW="100%" items="center" gap="$1">
          <SizableText
            size="$2"
            text="center"
            fontSize={Math.max(10, size * 0.08)}
            ellipse
            maxW="100%"
          >
            {fileName.split('.')[0] || 'File'}
          </SizableText>

          {attachment.data && (
            <SizableText size="$1" opacity={0.6} fontSize={Math.max(8, size * 0.06)}>
              {formatFileSize(attachment.data as any as number)}
            </SizableText>
          )}
        </YStack>

        <Square
          position="absolute"
          b="$2"
          r="$2"
          size={24}
          bg="$color02"
          rounded="$2"
          items="center"
          justify="center"
          opacity={0.8}
        >
          <Download size={14} color="$color12" />
        </Square>
      </YStack>
    )
  }

  return <Square size={size} bg="$color2" />
}
