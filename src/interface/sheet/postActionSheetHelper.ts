import { createRef } from 'react'
import type { Post } from '~/data/types'
import type { PostActionSheetRef } from './PostActionSheet'
// import type { PostOwnerActionSheetRef } from './PostOwnerActionSheet'

// Global refs for the sheets
export const postActionSheetRef = createRef<PostActionSheetRef>()
// export const postOwnerActionSheetRef = createRef<PostOwnerActionSheetRef>()

export type PostActionSheetOptions = {
  shouldNavigateBackOnDelete?: boolean
}

// Helper function to show appropriate post action sheet from anywhere
export const showPostActionSheet = (
  data: Post,
  isOwnProfile?: boolean,
  options?: PostActionSheetOptions
) => {
  if (isOwnProfile) {
    // postOwnerActionSheetRef.current?.show(data, options)
  } else {
    postActionSheetRef.current?.show(data)
  }
}

// Helper function to hide post action sheets
export const hidePostActionSheet = () => {
  postActionSheetRef.current?.hide()
  // postOwnerActionSheetRef.current?.hide()
}
