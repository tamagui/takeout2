import { useMemo, useState } from 'react'
import { isWeb, useDebounceValue } from 'tamagui'

import { feedPosts, postsPaginated, searchPosts } from '~/data/queries/post'
import { useQuery } from '~/zero/client'

import type { Post } from '~/data/types'

type PostCursor = { id: string; createdAt: number } | null

export function usePostsPaginated(pageSize = 3) {
  // native: cursor-based infinite scroll
  const [allPostsData, setAllPostsData] = useState<Post[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false)
  const [cursor, setCursor] = useState<PostCursor>(null)
  // web: page-based pagination
  const [currentPage, setCurrentPage] = useState(1)

  // blocking is handled server-side via notBlockedByViewer permission
  // server filters with not(exists()), client query becomes no-op
  const [posts, status] = useQuery(feedPosts, {
    pageSize,
    cursor: isWeb ? null : cursor,
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
        setCursor({ id: lastPost.id, createdAt: lastPost.createdAt })
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

// cursor-based pagination for user posts
export function usePostsByUserId(userId: string, pageSize = 12) {
  const [allPostsData, setAllPostsData] = useState<Post[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false)
  const [cursor, setCursor] = useState<PostCursor>(null)

  const [posts, status] = useQuery(
    postsPaginated,
    {
      userId,
      pageSize,
      cursor,
    },
    { enabled: Boolean(userId) }
  )

  // accumulate posts when new data arrives
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
        setCursor({ id: lastPost.id, createdAt: lastPost.createdAt })
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

// search posts
export function usePostsSearch(pageSize = 12) {
  const [searchText, setSearchText] = useState<string>('')
  const debouncedSearchText = useDebounceValue(searchText, 300)
  const [allPostsData, setAllPostsData] = useState<Post[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false)
  const [cursor, setCursor] = useState<PostCursor>(null)
  const [lastSearchText, setLastSearchText] = useState<string>('')

  // blocking is handled server-side via notBlockedByViewer permission
  const [posts, status] = useQuery(
    searchPosts,
    {
      searchText: debouncedSearchText,
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
        setCursor({ id: lastPost.id, createdAt: lastPost.createdAt })
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
