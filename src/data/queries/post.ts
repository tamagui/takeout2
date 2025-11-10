import { serverWhere, zql } from 'over-zero'

const permission = serverWhere('post', () => {
  return true
})

export const allPosts = (props: { limit?: number }) => {
  return zql.post
    .where(permission)
    .orderBy('createdAt', 'desc')
    .orderBy('id', 'desc')
    .limit(props.limit || 20)
}

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

// Paginated posts query with cursor support
export const postsPaginated = (props: {
  pageSize: number
  cursor?: { id: string } | null
}) => {
  let query = zql.post
    .where(permission)
    .orderBy('createdAt', 'desc')
    .orderBy('id', 'desc')
    .limit(props.pageSize)

  if (props.cursor) {
    query = query.start(props.cursor)
  }

  return query
}

// User posts with pagination
export const userPostsPaginated = (props: {
  userId: string
  pageSize: number
  cursor?: { id: string } | null
}) => {
  let query = zql.post
    .where(permission)
    .where('userId', props.userId)
    .orderBy('createdAt', 'desc')
    .orderBy('id', 'desc')
    .limit(props.pageSize)

  if (props.cursor) {
    query = query.start(props.cursor)
  }

  return query
}

// Posts filtered with blocking logic
export const postsWithBlocking = (props: {
  userId?: string
  blockedUserIds: string[]
  pageSize: number
  cursor?: { id: string } | null
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

  if (props.cursor) {
    query = query.start(props.cursor)
  }

  return query
}
