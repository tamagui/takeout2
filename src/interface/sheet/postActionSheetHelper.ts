import { createRef } from 'react'
import type { Post } from '~/data/types'
import type { PostActionSheetRef } from './PostActionSheet'

// Global refs for the sheets
export const postActionSheetRef = createRef<PostActionSheetRef>()

export type PostActionSheetOptions = {
  shouldNavigateBackOnDelete?: boolean
}

// Helper function to show appropriate post action sheet from anywhere
export const showPostActionSheet = (
  data: Post,
  isOwnProfile?: boolean,
  options?: PostActionSheetOptions
) => {
  postActionSheetRef.current?.show(data, isOwnProfile, options)
}

// Helper function to hide post action sheets
export const hidePostActionSheet = () => {
  postActionSheetRef.current?.hide()
}
