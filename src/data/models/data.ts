import { enumeration, number, string, table } from '@rocicorp/zero'
import { ensure } from '@vxrn/helpers'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'
import type { AppDataPermission } from 'start/types'
import { hasServerEditPermission } from '../where/server'

export type Data = TableInsertRow<typeof schema>

export const schema = table('data')
  .columns({
    id: string(),
    serverId: string(),
    channelId: string(),
    appId: string(),
    appInstallId: string(),
    creatorId: string(),
    title: string().optional(),
    category: string().optional(),
    status: string().optional(),
    key: string(),
    value: string(),
    reliability: number(),
    type: string(),
    permissions: enumeration<AppDataPermission>(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('id')

export const permissions = where('data', (_, auth) => {
  return {
    read: hasServerEditPermission(_, auth),
    write: _.cmp('creatorId', auth?.id || ''), // only creator can edit
  }
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, authData, server }, row: Data) => {
    ensure(authData, 'authData')
    await tx.mutate.data.insert(row)

    // side effect: update search index if not private
    if (server) {
      server.asyncTasks.push(async () => {
        await server.actions.data.addToSearch(row)
      })

      server.asyncTasks.push(async () => {
        await server.actions.task.runTaskTriggersForData(row)
      })
    }
  },

  update: async (
    { tx, authData, server },
    partialRow: Partial<Data> & { id: string }
  ) => {
    ensure(authData, 'authData')
    await tx.mutate.data.update(partialRow)

    if (server) {
      const existing = await tx.query.data.where('id', partialRow.id).one()
      const fullRow = { ...existing, ...partialRow }
      server.asyncTasks.push(async () => {
        await server.actions.data.updateSearch(fullRow)
      })
    }
  },

  delete_: async ({ tx, authData }, pk: { id: string }) => {
    ensure(authData, 'authData')
    await tx.mutate.data.delete(pk)
    // search indexing handled by database triggers
  },

  deleteAll: async ({ tx, authData }, serverId: string) => {
    ensure(authData, 'authData')

    // search indexing handled by database triggers
    const allData = await tx.query.data.where('serverId', serverId)

    for (const item of allData) {
      await tx.mutate.data.delete(item)
    }
  },
})
