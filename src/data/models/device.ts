import { enumeration, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'

// TODO
type DeviceType = string

export type Device = TableInsertRow<typeof schema>

export const schema = table('device')
  .columns({
    id: string(),
    userId: string(),
    name: string().optional(),
    platform: string(), // ios, android, web
    platformVersion: string().optional(),
    appVersion: string().optional(),
    pushToken: string().optional(),
    pushEnabled: number(), // boolean stored as integer
    lastActiveAt: number().optional(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('id')

export const permissions = where('device', (_, auth) => {
  return {
    read: _.cmp('userId', auth?.id || ''),
    write: _.cmp('userId', auth?.id || ''),
  }
})

export const mutate = mutations(schema, permissions)
