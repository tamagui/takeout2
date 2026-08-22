import { serverWhere, zql } from 'on-zero'

const permission = serverWhere('comment', () => {
  return true
})

export const commentsByPostId = (props: { postId: string; limit?: number }) => {
  return zql.comment
    .where(permission)
    .where('postId', props.postId)
    .orderBy('createdAt', 'asc')
    .limit(props.limit || 50)
    .related('user', (q) => q.one())
}
