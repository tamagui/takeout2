import { where } from 'over-zero'

export const isUsersOwn = where<'character' | 'chat'>((_, auth) =>
  _.cmp('userId', '=', auth?.id || '')
)
