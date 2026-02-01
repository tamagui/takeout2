import { boolean, number, string, table } from '@rocicorp/zero'
import { mutations, serverWhere } from 'on-zero'

import type { TableInsertRow } from 'on-zero'

export type UserState = TableInsertRow<typeof schema>

export const schema = table('userState')
  .columns({
    userId: string(),
    darkMode: boolean(),
    locale: string(),
    timeZone: string(),
    onlineStatus: string(),
    lastNotificationReadAt: number().optional(),
  })
  .primaryKey('userId')

const permissions = serverWhere('userState', (_, auth) => {
  return _.cmp('userId', auth?.id || '')
})

export const mutate = mutations(schema, permissions)
