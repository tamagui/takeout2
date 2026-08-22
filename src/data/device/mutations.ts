import { mutations, serverWhere } from 'on-zero'

const permissions = serverWhere('device', (_, auth) => {
  return _.cmp('userId', auth?.id || '')
})

export const mutate = mutations('device', permissions)
