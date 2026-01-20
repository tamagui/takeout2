import { SizableText, Spinner, YStack } from 'tamagui'

import { commentsByPostId } from '~/data/queries/comment'
import { CommentItem } from '~/features/feed/CommentItem'
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
            <CommentItem
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
