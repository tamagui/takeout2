import { useMemo, useState } from 'react'
import { useDebounceValue } from 'tamagui'

import { blockedByUser } from '~/data/queries/block'
import { postsPaginated, postsWithBlocks, searchPosts } from '~/data/queries/post'
import { useAuth } from '~/features/auth/client/authClient'
import { useQuery } from '~/zero/client'

import type { Post } from '~/data/types'

export function usePostsPaginated(pageSize = 3) {
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
  const [posts, status] = useQuery(postsWithBlocks, {
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
    postsPaginated,
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

// Search posts
export function usePostsSearch(pageSize = 12) {
  const { user } = useAuth()
  const [searchText, setSearchText] = useState<string>('')
  const debouncedSearchText = useDebounceValue(searchText, 300)
  const [allPostsData, setAllPostsData] = useState<Post[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false)
  const [cursor, setCursor] = useState<Post | null>(null)
  const [lastSearchText, setLastSearchText] = useState<string>('')

  // query blocked users
  const [blockedByMe] = useQuery(
    blockedByUser,
    { userId: user?.id || 'no-user', limit: 100 },
    { enabled: Boolean(user?.id) }
  )

  // get blocked user ids
  const blockedUserIds = useMemo(() => {
    return blockedByMe?.map((b) => b.blockedId) || []
  }, [blockedByMe])

  // query posts with search filter
  const [posts, status] = useQuery(
    searchPosts,
    {
      searchText: debouncedSearchText,
      userId: user?.id,
      blockedUserIds,
      pageSize,
      cursor,
    },
    { enabled: Boolean(debouncedSearchText) }
  )

  // accumulate posts when new data arrives
  useMemo(() => {
    // reset if search text changed
    if (debouncedSearchText !== lastSearchText) {
      setLastSearchText(debouncedSearchText)
      setAllPostsData([])
      setCursor(null)
      setHasInitialLoad(false)
      setIsLoadingMore(false)
      return
    }

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
  }, [posts, cursor, hasInitialLoad, debouncedSearchText, lastSearchText])

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

  const isSearching = Boolean(debouncedSearchText) && status.type === 'unknown' && !cursor
  const hasMore = posts ? posts.length === pageSize : false

  return {
    posts: allPostsData,
    searchText,
    setSearchText,
    isSearching,
    isLoadingMore,
    hasMore,
    loadMore,
  }
}
