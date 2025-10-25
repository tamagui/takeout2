/**
 * TODO unify with .native no reason to have separate
 */

import { memo } from 'react'
import type { Post } from '~/data/models'

interface PostCardProps {
  post: Post
}

export const PostCard = memo(({ post }: PostCardProps) => {
  return null
})
