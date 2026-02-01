import { boolean, number, string, table } from '@rocicorp/zero'
import { mutations, serverWhere } from 'on-zero'

export const schema = table('device')
  .columns({
    id: string(),
    userId: string(),
    name: string().optional(),
    platform: string(), // ios, android, web
    platformVersion: string().optional(),
    appVersion: string().optional(),
    pushToken: string().optional(),
    pushEnabled: boolean(),
    lastActiveAt: number().optional(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('id')

const permissions = serverWhere('device', (_, auth) => {
  return _.cmp('userId', auth?.id || '')
})

export const mutate = mutations(schema, permissions)
