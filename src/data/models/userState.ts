import { boolean, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'

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

const permissions = where('userState', (_, auth) => {
  return _.cmp('userId', auth?.id || '')
})

export const mutate = mutations(schema, permissions)
