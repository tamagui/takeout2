import { useMemo, useState } from 'react'
import { useAuth } from '~/auth/client/authClient'
import type { Post } from '~/data/models'
import { useQuery, zero } from '~/zero/client'

interface UsePostsOptions {
  limit?: number
  offset?: number
}

// simple query with fixed limit - for static lists, not infinite scroll
export function usePosts(options?: UsePostsOptions) {
  const { limit = 20 } = options || {}

  const query = useMemo(() => {
    return zero.query.post
      .where('draft', false)
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .limit(limit)
  }, [limit])

  const [posts, status] = useQuery(query)

  return {
    posts: (posts || []) as Post[],
    isLoading: status.type === 'unknown',
    isEmpty: posts ? posts.length === 0 : true,
    hasMore: posts ? posts.length === limit : false,
  }
}

// cursor-based pagination with .start() - efficient like zbugs
export function usePostsPaginated(pageSize = 10) {
  const { user } = useAuth()
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false)
  const [cursor, setCursor] = useState<Post | null>(null)

  // query blocks where I'm the blocker
  const blockedByMeQuery = useMemo(() => {
    return zero.query.block.where('blockerId', user?.id || 'no-user').limit(100)
  }, [user?.id])

  const [blockedByMe] = useQuery(blockedByMeQuery, {
    enabled: Boolean(user?.id),
  })

  // post filtering with blocking - cursor-based pagination
  const query = useMemo(() => {
    let q = zero.query.post
      .where((eb) => {
        // TODO[hiddenByAdmin][2]: enable this after the third deploy when we have the hiddenByAdmin field fully rolled out
        // const draftCondition = eb.and(
        //   eb.cmp('draft', false),
        //   eb.cmp('hiddenByAdmin', false)
        // )
        const draftCondition = eb.cmp('draft', false)

        if (!user?.id) {
          return draftCondition
        }

        const blockedByMeIds = blockedByMe?.map((b) => b.blockedId) || []
        const allBlockedIds = [...blockedByMeIds]

        if (allBlockedIds.length > 0) {
          const notFromBlockedUsers = eb.not(eb.cmp('userId', 'IN', allBlockedIds))
          return eb.and(draftCondition, notFromBlockedUsers)
        }

        return draftCondition
      })
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .limit(pageSize)

    if (cursor) {
      q = q.start(cursor)
    }

    return q
  }, [pageSize, user?.id, blockedByMe, cursor])

  const [posts, status] = useQuery(query)

  // accumulate posts when new data arrives
  useMemo(() => {
    if (posts && posts.length > 0) {
      setAllPosts((prev) => {
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
    setAllPosts([])
    setHasInitialLoad(false)
    setIsLoadingMore(false)
  }

  const isInitialLoading = status.type === 'unknown' && !cursor
  const hasMore = posts ? posts.length === pageSize : false

  return {
    posts: allPosts,
    isLoading: isInitialLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  }
}

// cursor-based pagination for user posts
export function usePostsByUserId(userId: string, pageSize = 12) {
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false)
  const [cursor, setCursor] = useState<Post | null>(null)

  const query = useMemo(() => {
    let q = zero.query.post
      .where('userId', userId)
      .where('draft', false)
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .limit(pageSize)

    if (cursor) {
      q = q.start(cursor)
    }

    return q
  }, [userId, pageSize, cursor])

  const [posts, status] = useQuery(query, { enabled: Boolean(userId) })

  // accumulate posts when new data arrives
  useMemo(() => {
    if (posts && posts.length > 0) {
      setAllPosts((prev) => {
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
    setAllPosts([])
    setHasInitialLoad(false)
    setIsLoadingMore(false)
  }

  const isInitialLoading = status.type === 'unknown' && !cursor && Boolean(userId)
  const hasMore = posts ? posts.length === pageSize : false

  return {
    posts: allPosts,
    isLoading: isInitialLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  }
}
