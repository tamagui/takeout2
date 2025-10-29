import { where } from 'over-zero'

export const isUsersOwn = where<'userPublic'>((_, auth) =>
  _.cmp('id', '=', auth?.id || '')
)
