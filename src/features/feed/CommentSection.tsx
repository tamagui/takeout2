import { Separator, SizableText, YStack } from 'tamagui'

import { CommentItem } from '~/features/feed/CommentItem'
import { ChatCircleDotsIcon } from '~/interface/icons/phosphor/ChatCircleDotsIcon'
import { Text } from '~/interface/text/Text'

import type { CommentWithUser } from '~/data/types'

interface CommentSectionProps {
  comments: readonly CommentWithUser[]
}

export function CommentSection({ comments }: CommentSectionProps) {
  const count = comments.length

  return (
    <YStack pt="$4">
      {process.env.VITE_NATIVE ? (
        <Separator mt="$1" mb="$4" borderColor="$color4" />
      ) : null}

      {count > 0 && (
        <SizableText size="$3" fontWeight="600" pb="$2" color="$color7">
          Comments ({count})
        </SizableText>
      )}

      {count === 0 ? (
        <YStack items="center" gap="$3" py="$6">
          <ChatCircleDotsIcon size={36} color="$color8" />
          <Text size="$3" color="$color10">
            No comments yet
          </Text>
        </YStack>
      ) : (
        <YStack gap="$4" pt="$2">
          {comments.map((comment, index) => (
            <CommentItem
              index={index}
              key={comment.id}
              image={comment.user?.image}
              username={comment.user?.username}
              content={comment.content}
              createdAt={comment.createdAt}
            />
          ))}
        </YStack>
      )}
    </YStack>
  )
}
