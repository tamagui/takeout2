import { formatDistanceToNow } from '@take-out/helpers'
import { memo } from 'react'
import { SizableText, XStack, YStack } from 'tamagui'

import { Avatar } from '~/interface/avatars/Avatar'
import { DotIcon } from '~/interface/icons/phosphor/DotIcon'
import { Text } from '~/interface/text/Text'

interface CommentItemProps {
  image?: string | null
  username?: string | null
  content: string
  createdAt: number
  index: number
}

export const CommentItem = memo(
  ({ image, username, content, createdAt, index }: CommentItemProps) => {
    return (
      <XStack
        data-testid="comment-item"
        data-comment-content={content}
        transition={[
          '200ms',
          {
            delay: index * 100,
          },
        ]}
        gap="$3"
        py="$1.5"
        enterStyle={{ opacity: 0, y: 10 }}
      >
        <Avatar image={image || ''} size={36} />
        <YStack flex={1} gap="$1.5">
          <XStack items="center" gap="$1">
            <SizableText size="$3" fontWeight="600" color="$color12">
              {username || 'Unknown'}
            </SizableText>
            <DotIcon size={14} color="$color8" />
            <SizableText size="$2" color="$color9">
              {formatDistanceToNow(createdAt)}
            </SizableText>
          </XStack>
          <Text size="$3" color="$color11" lineHeight="$3">
            {content}
          </Text>
        </YStack>
      </XStack>
    )
  }
)
