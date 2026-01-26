import { serverWhere, zql } from 'over-zero'

const permission = serverWhere('post', () => {
  // TODO
  return true
})

export const postById = (props: { postId: string }) => {
  return zql.post.where(permission).where('id', props.postId).one()
}

export const postsByUserId = (props: { userId: string; limit?: number }) => {
  return zql.post
    .where(permission)
    .where('userId', props.userId)
    .orderBy('createdAt', 'desc')
    .orderBy('id', 'desc')
    .limit(props.limit || 20)
}

export const postsPaginated = (props: {
  userId?: string
  pageSize: number
  cursor?: { id: string; createdAt: number } | null
}) => {
  let query = zql.post
    .where(permission)
    .orderBy('createdAt', 'desc')
    .orderBy('id', 'desc')
    .limit(props.pageSize)

  if (props.userId) {
    query = query.where('userId', props.userId)
  }

  if (props.cursor) {
    query = query.start(props.cursor)
  }

  return query
}

export const postsWithBlocks = (props: {
  userId?: string
  blockedUserIds: string[]
  pageSize: number
  cursor?: { id: string; createdAt: number } | null
}) => {
  let query = zql.post
    .where(permission)
    .where((eb) => {
      if (!props.userId) {
        return eb.cmp('id', '!=', '')
      }

      if (props.blockedUserIds.length > 0) {
        return eb.not(eb.cmp('userId', 'IN', props.blockedUserIds))
      }

      return eb.cmp('id', '!=', '')
    })
    .orderBy('createdAt', 'desc')
    .orderBy('id', 'desc')
    .limit(props.pageSize)
    .related('comments', (q) =>
      q
        .orderBy('createdAt', 'desc')
        .limit(1)
        .related('user', (u) => u.one())
    )

  if (props.cursor) {
    query = query.start(props.cursor)
  }

  return query
}

export const searchPosts = (props: {
  searchText: string
  userId?: string
  blockedUserIds: string[]
  pageSize: number
  cursor?: { id: string; createdAt: number } | null
}) => {
  let query = zql.post.where(permission).where((eb) => {
    if (!props.searchText) {
      return eb.cmp('id', '!=', '')
    }

    const captionCondition = eb.cmp('caption', 'LIKE', `%${props.searchText}%`)

    if (props.userId && props.blockedUserIds.length > 0) {
      return eb.and(
        captionCondition,
        eb.not(eb.cmp('userId', 'IN', props.blockedUserIds))
      )
    }

    return captionCondition
  })

  query = query.orderBy('createdAt', 'desc').orderBy('id', 'desc').limit(props.pageSize)

  if (props.cursor) {
    query = query.start(props.cursor)
  }

  return query
}
