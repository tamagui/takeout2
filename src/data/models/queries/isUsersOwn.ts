import { where } from 'over-zero'
import type * as tables from '~/data/tables'

// Generic helper for checking if a record belongs to the current user
export const isUsersOwn = where<keyof typeof tables>((_, auth) =>
  _.cmp('id', '=', auth?.id || '')
)
