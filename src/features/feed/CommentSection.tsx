import { randomId } from '@take-out/helpers'
import { useState } from 'react'
import { SizableText, Spinner, XStack, YStack } from 'tamagui'

import { commentsByPostId } from '~/data/queries/comment'
import { useAuth } from '~/features/auth/client/authClient'
import { formatDistanceToNow } from '~/helpers/date/formatDate'
import { Avatar } from '~/interface/avatars/Avatar'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { TextArea } from '~/interface/forms/TextArea'
import { Text } from '~/interface/text/Text'
import { useQuery, zero } from '~/zero/client'

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth()
  const [comments, status] = useQuery(commentsByPostId, { postId })
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim() || !user?.id) return

    setIsSubmitting(true)
    try {
      await zero.mutate.comment.insert({
        id: randomId(),
        postId,
        userId: user.id,
        content: content.trim(),
        createdAt: Date.now(),
      })
      setContent('')
    } finally {
      setIsSubmitting(false)
    }
  }

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

      {user && (
        <YStack gap="$2" pt="$2">
          <TextArea
            size="small"
            placeholder="Add a comment..."
            value={content}
            onChangeText={setContent}
            minH={60}
          />
          <XStack justify="flex-end">
            <ButtonSimple
              size="small"
              theme="accent"
              disabled={!content.trim() || isSubmitting}
              onPress={handleSubmit}
            >
              {isSubmitting ? <Spinner size="small" /> : 'Post'}
            </ButtonSimple>
          </XStack>
        </YStack>
      )}
    </YStack>
  )
}
