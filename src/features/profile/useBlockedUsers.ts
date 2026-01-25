import { useMemo, useState } from 'react'

import { blockedByUser } from '~/data/queries/block'
import { useAuth } from '~/features/auth/client/authClient'
import { useQuery, zero } from '~/zero/client'

import type { User } from '~/data/types'

interface UseBlockedUsersOptions {
  pageSize?: number
}

export function useBlockedUsers(options?: UseBlockedUsersOptions) {
  const { pageSize = 20 } = options || {}
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false)

  const [blocks, status] = useQuery(
    blockedByUser,
    { userId: user?.id || '', limit: pageSize * (currentPage + 1) },
    {
      enabled: Boolean(user?.id),
    }
  )

  useMemo(() => {
    if (blocks) {
      const users = blocks.map((block) => block.blocked).filter(Boolean) as User[]
      setAllUsers(users)
      setIsLoadingMore(false)
      if (!hasInitialLoad) {
        setHasInitialLoad(true)
      }
    }
  }, [blocks, hasInitialLoad])

  const loadMore = () => {
    const hasMore = blocks ? blocks.length === pageSize * (currentPage + 1) : false
    if (!isLoadingMore && hasMore && hasInitialLoad) {
      setIsLoadingMore(true)
      setCurrentPage((prev) => prev + 1)
    }
  }

  const refresh = () => {
    setCurrentPage(0)
    setHasInitialLoad(false)
    setIsLoadingMore(false)
  }

  const unblockUser = async (blockedUserId: string) => {
    if (!user?.id || !blocks) return

    const block = blocks.find((b) => b.blockedId === blockedUserId)
    if (!block) {
      console.error('Block not found for user:', blockedUserId)
      return
    }

    try {
      await zero.mutate.block.delete({ id: block.id, blockedUserId }).client
    } catch (error) {
      console.error('Failed to unblock user:', error)
    }
  }

  const isInitialLoading = status.type === 'unknown' && currentPage === 0
  const hasMore = blocks ? blocks.length === pageSize * (currentPage + 1) : false

  return {
    blockedUsers: allUsers,
    isLoading: isInitialLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
    unblockUser,
    isEmpty: allUsers.length === 0 && !isInitialLoading,
  }
}
