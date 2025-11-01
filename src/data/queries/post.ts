import { where, zql } from 'over-zero'

const permission = where('post', () => {
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
