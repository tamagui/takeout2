import { where, zql } from 'over-zero'

const permission = where('block', (_, auth) => {
  return _.cmp('blockerId', auth?.id || '')
})

export const blockedByUser = (props: { userId: string; limit?: number }) => {
  return zql.block
    .where(permission)
    .where('blockerId', props.userId)
    .orderBy('createdAt', 'desc')
    .limit(props.limit || 100)
    .related('blocked', (q) => q.one())
}
