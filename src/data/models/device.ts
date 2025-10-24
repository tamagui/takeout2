import { enumeration, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'
import type { DeviceType } from 'start/types'

export type Device = TableInsertRow<typeof schema>

export const schema = table('device')
  .columns({
    id: string(),
    userId: string(),
    sessionId: string(),
    type: enumeration<DeviceType>(),
    name: string().optional(),
    appBundleId: string(),
    deviceToken: string(),
    brand: string().optional(),
    model: string().optional(),
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
