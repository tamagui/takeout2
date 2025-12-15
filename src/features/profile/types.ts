import type { Post, User } from '~/data/types'

export interface ProfilePageProps {
  userId: string
  isOwnProfile: boolean
}

export interface UseProfilePostsOptions {
  userId: string
  pageSize?: number
}

export interface UseProfilePostsResult {
  posts: readonly Post[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  hasMore: boolean
  // for native infinite scroll
  loadMore: () => void
  refresh: () => void
  isLoadingMore: boolean
  // for web pagination
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
}

export type { Post, User }
