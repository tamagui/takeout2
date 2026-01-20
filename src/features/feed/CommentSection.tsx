import { formatDistanceToNow } from '@take-out/helpers'
import { SizableText, Spinner, XStack, YStack } from 'tamagui'

import { commentsByPostId } from '~/data/queries/comment'
import { Avatar } from '~/interface/avatars/Avatar'
import { Text } from '~/interface/text/Text'
import { useQuery } from '~/zero/client'

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, status] = useQuery(commentsByPostId, { postId })
  const isLoading = status.type === 'unknown'

  return (
    <YStack gap="$4" pt="$4">
      <SizableText size="$5" fontWeight="600">
        Comments {comments?.length ? `(${comments.length})` : ''}
      </SizableText>

      {isLoading ? (
        <YStack items="center" py="$4">
          <Spinner />
        </YStack>
      ) : comments?.length === 0 ? (
        <Text color="$color10">No comments yet. Be the first to comment!</Text>
      ) : (
        <YStack gap="$3">
          {comments?.map((comment) => (
            <XStack key={comment.id} gap="$3">
              <Avatar image={comment.user?.image || ''} size={32} />
              <YStack flex={1} gap="$1">
                <XStack items="center" gap="$2">
                  <SizableText size="$3" fontWeight="600">
                    {comment.user?.username || 'Unknown'}
                  </SizableText>
                  <SizableText size="$2" color="$color10">
                    {formatDistanceToNow(comment.createdAt)}
                  </SizableText>
                </XStack>
                <Text size="$3">{comment.content}</Text>
              </YStack>
            </XStack>
          ))}
        </YStack>
      )}
    </YStack>
  )
}
