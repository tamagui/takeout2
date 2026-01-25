import { formatDistanceToNow } from '@take-out/helpers'
import { memo } from 'react'
import { SizableText, XStack, YStack } from 'tamagui'

import { Avatar } from '~/interface/avatars/Avatar'
import { Text } from '~/interface/text/Text'

interface CommentItemProps {
  image?: string | null
  username?: string | null
  content: string
  createdAt: number
}

export const CommentItem = memo(({ image, username, content, createdAt }: CommentItemProps) => {
  return (
    <XStack gap="$3">
      <Avatar image={image || ''} size={32} />
      <YStack flex={1} gap="$1">
        <XStack items="center" gap="$2">
          <SizableText size="$3" fontWeight="600">
            {username || 'Unknown'}
          </SizableText>
          <SizableText size="$2" color="$color10">
            {formatDistanceToNow(createdAt)}
          </SizableText>
        </XStack>
        <Text size="$3">{content}</Text>
      </YStack>
    </XStack>
  )
})
