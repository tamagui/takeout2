import { H4, SizableText, XStack, YStack } from 'tamagui'
import { LinearGradient } from 'tamagui/linear-gradient'
import type { UnfurlData } from '~/features/unfurl/unfurl'
import { AttachmentItemMedia } from './AttachmentItemMedia'
import { getAttachmentSize } from './constants'
import type { AttachmentItemUnfurlProps } from './types'

export const AttachmentItemUnfurl = (props: AttachmentItemUnfurlProps) => {
  const { attachment, size = 'small', onPress } = props
  const unfurlData = attachment.data ? (JSON.parse(attachment.data) as UnfurlData) : null

  if (!unfurlData) {
    return null
  }

  const mediaUrl = unfurlData.image || unfurlData.video?.url
  const hasMedia = Boolean(mediaUrl)
  const sizeValue = getAttachmentSize(props)

  const faviconElement = !!unfurlData.favicon && (
    <XStack items="center" gap="$2">
      <img src={unfurlData.favicon} width={16} height={16} />
      <SizableText size="$1" color="$color10">
        {unfurlData.siteName}
      </SizableText>
    </XStack>
  )

  const content =
    size === 'small' ? (
      <>
        <YStack position="absolute" fullscreen>
          {mediaUrl ? (
            <AttachmentItemMedia
              attachment={{ ...attachment, url: mediaUrl }}
              size={size}
            />
          ) : (
            faviconElement
          )}
        </YStack>
        <LinearGradient
          colors={['transparent', '$shadow6']}
          start={[0, 0.5]}
          end={[0, 1]}
          position="absolute"
          inset={0}
          pointerEvents="none"
          z={0}
        />
        <YStack>
          <SizableText size="$1" color="$color12" ellipse numberOfLines={1}>
            {unfurlData.title || unfurlData.siteName || 'Link'}
          </SizableText>
        </YStack>
      </>
    ) : (
      <>
        {hasMedia && mediaUrl && (
          <YStack width="100%" height={sizeValue}>
            <AttachmentItemMedia
              attachment={{ ...attachment, url: mediaUrl }}
              size={size}
            />
          </YStack>
        )}

        <YStack p="$3" gap="$2">
          {faviconElement}

          {unfurlData.title && (
            <H4 size="$3" numberOfLines={2} ellipse>
              {unfurlData.title}
            </H4>
          )}

          {unfurlData.description && size === 'large' && (
            <SizableText size="$2" color="$color11" numberOfLines={3} ellipse>
              {unfurlData.description}
            </SizableText>
          )}

          {unfurlData.url && (
            <SizableText size="$1" color="$color10" numberOfLines={1} ellipse>
              {unfurlData.url}
            </SizableText>
          )}
        </YStack>
      </>
    )

  return (
    <YStack
      onPress={onPress}
      height={sizeValue}
      minW={sizeValue}
      rounded="$3"
      overflow="hidden"
      bg="$color2"
      cursor={onPress ? 'pointer' : undefined}
      hoverStyle={onPress ? { opacity: 0.95 } : undefined}
      pressStyle={onPress ? { opacity: 0.9, scale: 0.98 } : undefined}
    >
      {content}
    </YStack>
  )
}
