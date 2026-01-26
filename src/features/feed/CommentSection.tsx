import { Separator, SizableText, Spinner, YStack } from 'tamagui'

import { commentsByPostId } from '~/data/queries/comment'
import { CommentItem } from '~/features/feed/CommentItem'
import { ChatCircleDotsIcon } from '~/interface/icons/phosphor/ChatCircleDotsIcon'
import { Text } from '~/interface/text/Text'
import { useQuery } from '~/zero/client'

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, status] = useQuery(commentsByPostId, { postId })
  const isLoading = status.type === 'unknown'
  const count = comments?.length ?? 0

  return (
    <YStack pt="$4">
      {process.env.VITE_PLATFORM !== 'web' && <Separator borderColor="$color4" />}

      {count > 0 && (
        <SizableText size="$5" fontWeight="600" pt="$4" pb="$2">
          Comments{count > 0 ? ` (${count})` : ''}
        </SizableText>
      )}

      {isLoading ? (
        <YStack items="center" py="$6">
          <Spinner size="large" color="$color10" />
        </YStack>
      ) : count === 0 ? (
        <YStack items="center" gap="$3" py="$6">
          <ChatCircleDotsIcon size={36} color="$color8" />
          <Text size="$3" color="$color10">
            No comments yet
          </Text>
        </YStack>
      ) : (
        <YStack gap="$4" pt="$2">
          {comments?.map((comment, index) => (
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
