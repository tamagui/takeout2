import { zql } from 'on-zero'

import { notBlockedByViewer } from '~/data/where/notBlockedByViewer'

export const postById = (props: { postId: string }) => {
  return zql.post
    .where(notBlockedByViewer)
    .where('id', props.postId)
    .one()
    .related('user', (q) => q.one())
}

export const postsByUserId = (props: { userId: string; limit?: number }) => {
  return zql.post
    .where(notBlockedByViewer)
    .where('userId', props.userId)
    .orderBy('createdAt', 'desc')
    .orderBy('id', 'desc')
    .limit(props.limit || 20)
    .related('user', (q) => q.one())
}

export const postsPaginated = (props: {
  userId?: string
  pageSize: number
  cursor?: { id: string; createdAt: number } | null
}) => {
  let query = zql.post
    .where(notBlockedByViewer)
    .orderBy('createdAt', 'desc')
    .orderBy('id', 'desc')
    .limit(props.pageSize)
    .related('user', (q) => q.one())

  if (props.userId) {
    query = query.where('userId', props.userId)
  }

  if (props.cursor) {
    query = query.start(props.cursor)
  }

  return query
}

export const feedPosts = (props: {
  pageSize: number
  cursor?: { id: string; createdAt: number } | null
}) => {
  let query = zql.post
    .where(notBlockedByViewer)
    .orderBy('createdAt', 'desc')
    .orderBy('id', 'desc')
    .limit(props.pageSize)
    .related('user', (q) => q.one())
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

export const postDetail = (props: { postId: string }) => {
  return zql.post
    .where(notBlockedByViewer)
    .where('id', props.postId)
    .one()
    .related('user', (q) => q.one())
    .related('comments', (q) =>
      q
        .orderBy('createdAt', 'asc')
        .limit(50)
        .related('user', (u) => u.one())
    )
}

export const searchPosts = (props: {
  searchText: string
  pageSize: number
  cursor?: { id: string; createdAt: number } | null
}) => {
  let query = zql.post.where(notBlockedByViewer).where((eb) => {
    if (!props.searchText) {
      return eb.cmp('id', '!=', '')
    }
    return eb.cmp('caption', 'LIKE', `%${props.searchText}%`)
  })

  query = query
    .orderBy('createdAt', 'desc')
    .orderBy('id', 'desc')
    .limit(props.pageSize)
    .related('user', (q) => q.one())

  if (props.cursor) {
    query = query.start(props.cursor)
  }

  return query
}
