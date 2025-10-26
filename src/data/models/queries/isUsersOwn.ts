import { where } from 'over-zero'
import type * as tables from '~/data/tables'

export const isUsersOwn = where<keyof typeof tables>((_, auth) =>
  _.cmp('id', '=', auth?.id || '')
)
