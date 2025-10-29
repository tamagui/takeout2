import { boolean, json, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'

type UserSettings = {
  //
}

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

export const permissions = where('userState', (_, auth) => {
  const userId = auth?.id || ''

  return {
    read: _.cmp('userId', userId), // only user can read their own state
    write: _.cmp('userId', userId), // only user can edit their own state
  }
})

export const mutate = mutations(schema, permissions)
