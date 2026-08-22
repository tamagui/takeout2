import { mutations, serverWhere } from 'on-zero'

const permissions = serverWhere('notification', (_, auth) => {
  return _.cmp('userId', auth?.id || '')
})

export const mutate = mutations('notification', permissions)
