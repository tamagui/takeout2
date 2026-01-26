import { formatDistanceToNow } from '@take-out/helpers'
import { SizableText, XStack } from 'tamagui'

import type { CommentWithUser } from '~/data/types'

interface PostCommentPreviewProps {
  comment: CommentWithUser
}

export function PostCommentPreview({ comment }: PostCommentPreviewProps) {
  return (
    <XStack items="center" gap="$2" flex={1}>
      <SizableText size="$3" color="$color10" numberOfLines={1} flex={1} mr="$1">
        <SizableText size="$3" fontWeight="600" color="$color10">
          {comment.user?.username}
        </SizableText>{' '}
        {comment.content}
      </SizableText>
      <SizableText size="$2" color="$color8" shrink={0}>
        {formatDistanceToNow(comment.createdAt)}
      </SizableText>
    </XStack>
  )
}
