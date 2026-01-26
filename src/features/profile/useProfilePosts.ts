import { useMemo, useState } from 'react'
import { isWeb } from 'tamagui'

import { postsPaginated } from '~/data/queries/post'
import { useQuery } from '~/zero/client'

import type { UseProfilePostsOptions, UseProfilePostsResult } from './types'
import type { Post } from '~/data/types'

type PostCursor = { id: string; createdAt: number } | null

export function useProfilePosts({
  userId,
  pageSize = 12,
}: UseProfilePostsOptions): UseProfilePostsResult {
  // for native: cursor-based infinite scroll
  const [allPostsData, setAllPostsData] = useState<Post[]>([])
  const [cursor, setCursor] = useState<PostCursor>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasInitialLoad, setHasInitialLoad] = useState(false)

  // for web: page-based pagination
  const [currentPage, setCurrentPage] = useState(1)

  const [posts, status] = useQuery(
    postsPaginated,
    {
      userId,
      pageSize,
      cursor: isWeb ? null : cursor, // web fetches fresh each page
    },
    { enabled: Boolean(userId) }
  )

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

  // web: just use current page posts directly
  const displayPosts = isWeb ? (posts as Post[]) || [] : allPostsData

  const hasMore = posts ? posts.length === pageSize : false

  // only show loading if we have no data yet
  // this prevents shimmer flicker when Zero reconnects but already has cached data
  const hasData = posts && posts.length > 0
  const isLoading =
    status.type === 'unknown' && !hasData && (isWeb ? true : !cursor && Boolean(userId))

  // estimate total pages (we don't have total count, so estimate based on hasMore)
  const totalPages = hasMore ? currentPage + 1 : currentPage

  // native: infinite scroll
  const loadMore = () => {
    if (isWeb) return

    const hasMoreToFetch = posts && posts.length === pageSize
    if (!isLoadingMore && hasMoreToFetch && hasInitialLoad && posts && posts.length > 0) {
      setIsLoadingMore(true)
      const lastPost = posts[posts.length - 1]
      if (lastPost) {
        // only pass cursor fields, not the full post with relations
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
  const goToPage = (page: number) => {
    if (!isWeb || page < 1) return
    setCurrentPage(page)
  }

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
    isLoading,
    currentPage,
    totalPages,
    hasMore,
    loadMore,
    refresh,
    isLoadingMore,
    goToPage,
    nextPage,
    prevPage,
  }
}
