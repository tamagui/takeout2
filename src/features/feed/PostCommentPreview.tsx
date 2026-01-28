import { formatDistanceToNow } from '@take-out/helpers'
import { SizableText, XStack } from 'tamagui'

import type { CommentWithUser } from '~/data/types'

interface PostCommentPreviewProps {
  comment: CommentWithUser
}

export function PostCommentPreview({ comment }: PostCommentPreviewProps) {
  return (
    <XStack items="center" gap="$3" flex={1}>
      <SizableText size="$4" color="$color10" numberOfLines={1} flex={1}>
        <SizableText size="$4" fontWeight="500" color="$color10">
          {comment.user?.username}
        </SizableText>
        {'  '}
        {comment.content}
      </SizableText>
      <SizableText size="$3" color="$color8" shrink={0}>
        {formatDistanceToNow(comment.createdAt)}
      </SizableText>
    </XStack>
  )
}
