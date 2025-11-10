import { serverWhere } from 'over-zero'

export const isUsersOwn = serverWhere('userPublic', (_, auth) =>
  _.cmp('id', '=', auth?.id || '')
)
