import { useMemo, useState } from 'react'
import { isWeb, useDebounceValue } from 'tamagui'

import { blockedByUser } from '~/data/queries/block'
import { postsPaginated, postsWithBlocks, searchPosts } from '~/data/queries/post'
import { useAuth } from '~/features/auth/client/authClient'
import { useQuery } from '~/zero/client'

import type { Post } from '~/data/types'

export function usePostsPaginated(pageSize = 3) {
  const { user } = useAuth()
  // native: cursor-based infinite scroll
  const [allPostsData, setAllPostsData] = useState<Post[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false)
  const [cursor, setCursor] = useState<Post | null>(null)
  // web: page-based pagination
  const [currentPage, setCurrentPage] = useState(1)

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

  // query posts with blocking filter
  const [posts, status] = useQuery(postsWithBlocks, {
    userId: user?.id,
    blockedUserIds,
    pageSize,
    cursor: isWeb ? null : cursor, // web fetches fresh each page
  })

  // native: accumulate posts for infinite scroll
  useMemo(() => {
    if (!isWeb && posts && posts.length > 0) {
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

  // web: use current page posts directly, native: accumulated posts
  const displayPosts = isWeb ? (posts as Post[]) || [] : allPostsData

  const hasMore = posts ? posts.length === pageSize : false
  const isInitialLoading = status.type === 'unknown' && (isWeb ? true : !cursor)

  // native: infinite scroll
  const loadMore = () => {
    if (isWeb) return
    const hasMoreToFetch = posts && posts.length === pageSize

    if (!isLoadingMore && hasMoreToFetch && hasInitialLoad && posts && posts.length > 0) {
      setIsLoadingMore(true)
      const lastPost = posts[posts.length - 1]
      if (lastPost) {
        // only pass orderBy fields — passing the full post (with related data like
        // `comments`) causes Zero's NameMapper to choke on non-column fields
        setCursor({ id: lastPost.id, createdAt: lastPost.createdAt } as Post)
      }
    }
  }

  const refresh = () => {
    setCursor(null)
    setAllPostsData([])
    setHasInitialLoad(false)
    setIsLoadingMore(false)
    setCurrentPage(1)
  }

  // web: page navigation
  const nextPage = () => {
    if (!isWeb || !hasMore) return
    setCurrentPage((prev) => prev + 1)
  }

  const prevPage = () => {
    if (!isWeb || currentPage <= 1) return
    setCurrentPage((prev) => prev - 1)
  }

  return {
    posts: displayPosts,
    isLoading: isInitialLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
    // web pagination
    currentPage,
    nextPage,
    prevPage,
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
        setCursor({ id: lastPost.id, createdAt: lastPost.createdAt } as Post)
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
        setCursor({ id: lastPost.id, createdAt: lastPost.createdAt } as Post)
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
