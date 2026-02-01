import { serverWhere, zql } from 'on-zero'

const permission = serverWhere('block', (row, auth) => {
  return row.cmp('blockerId', auth?.id || '')
})

export const blockedByUser = (props: { userId: string; limit?: number }) => {
  return zql.block
    .where(permission)
    .where('blockerId', props.userId)
    .orderBy('createdAt', 'desc')
    .limit(props.limit || 100)
    .related('blocked', (q) => q.one())
}
