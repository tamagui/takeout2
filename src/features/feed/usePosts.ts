import { useMemo, useState } from 'react'
import { blockedByUser } from '~/data/queries/block'
import {
  allPosts,
  postsWithBlocking,
  postsPaginated,
  userPostsPaginated,
} from '~/data/queries/post'
import type { Post } from '~/data/types'
import { useAuth } from '~/features/auth/client/authClient'
import { useQuery } from '~/zero/client'

interface UsePostsOptions {
  limit?: number
  offset?: number
}

export function usePosts(options?: UsePostsOptions) {
  const { limit = 20 } = options || {}

  const [posts, status] = useQuery(allPosts, { limit })

  return {
    posts: (posts || []) as Post[],
    isLoading: status.type === 'unknown',
    isEmpty: posts ? posts.length === 0 : true,
    hasMore: posts ? posts.length === limit : false,
  }
}

export function usePostsPaginated(pageSize = 10) {
  const { user } = useAuth()
  const [allPostsData, setAllPostsData] = useState<Post[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false)
  const [cursor, setCursor] = useState<Post | null>(null)

  // Query blocked users
  const [blockedByMe] = useQuery(
    blockedByUser,
    { userId: user?.id || 'no-user', limit: 100 },
    { enabled: Boolean(user?.id) }
  )

  // Get blocked user IDs
  const blockedUserIds = useMemo(() => {
    return blockedByMe?.map((b) => b.blockedId) || []
  }, [blockedByMe])

  // Query posts with blocking filter
  const [posts, status] = useQuery(postsWithBlocking, {
    userId: user?.id,
    blockedUserIds,
    pageSize,
    cursor,
  })

  // Accumulate posts when new data arrives
  useMemo(() => {
    if (posts && posts.length > 0) {
      setAllPostsData((prev) => {
        if (!cursor) {
          return posts as Post[]
        }
        const newPosts = posts as Post[]
        const existingIds = new Set(prev.map((p) => p.id))
        const uniqueNewPosts = newPosts.filter((p) => !existingIds.has(p.id))
        return [...prev, ...uniqueNewPosts]
      })
      setIsLoadingMore(false)
      if (!hasInitialLoad) {
        setHasInitialLoad(true)
      }
    }
  }, [posts, cursor, hasInitialLoad])

  const loadMore = () => {
    const hasMoreToFetch = posts && posts.length === pageSize

    if (!isLoadingMore && hasMoreToFetch && hasInitialLoad && posts && posts.length > 0) {
      setIsLoadingMore(true)
      const lastPost = posts[posts.length - 1]
      if (lastPost) {
        setCursor(lastPost)
      }
    }
  }

  const refresh = () => {
    setCursor(null)
    setAllPostsData([])
    setHasInitialLoad(false)
    setIsLoadingMore(false)
  }

  const isInitialLoading = status.type === 'unknown' && !cursor
  const hasMore = posts ? posts.length === pageSize : false

  return {
    posts: allPostsData,
    isLoading: isInitialLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  }
}

// Cursor-based pagination for user posts
export function usePostsByUserId(userId: string, pageSize = 12) {
  const [allPostsData, setAllPostsData] = useState<Post[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false)
  const [cursor, setCursor] = useState<Post | null>(null)

  const [posts, status] = useQuery(
    userPostsPaginated,
    {
      userId,
      pageSize,
      cursor,
    },
    { enabled: Boolean(userId) }
  )

  // Accumulate posts when new data arrives
  useMemo(() => {
    if (posts && posts.length > 0) {
      setAllPostsData((prev) => {
        if (!cursor) {
          return posts as Post[]
        }
        const newPosts = posts as Post[]
        const existingIds = new Set(prev.map((p) => p.id))
        const uniqueNewPosts = newPosts.filter((p) => !existingIds.has(p.id))
        return [...prev, ...uniqueNewPosts]
      })
      setIsLoadingMore(false)
      if (!hasInitialLoad) {
        setHasInitialLoad(true)
      }
    }
  }, [posts, cursor, hasInitialLoad])

  const loadMore = () => {
    const hasMoreToFetch = posts && posts.length === pageSize
    if (!isLoadingMore && hasMoreToFetch && hasInitialLoad && posts && posts.length > 0) {
      setIsLoadingMore(true)

      const lastPost = posts[posts.length - 1]
      if (lastPost) {
        setCursor(lastPost)
      }
    }
  }

  const refresh = () => {
    setCursor(null)
    setAllPostsData([])
    setHasInitialLoad(false)
    setIsLoadingMore(false)
  }

  const isInitialLoading = status.type === 'unknown' && !cursor && Boolean(userId)
  const hasMore = posts ? posts.length === pageSize : false

  return {
    posts: allPostsData,
    isLoading: isInitialLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  }
}
