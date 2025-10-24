import { batchQuery } from 'over-zero'
import { zeroServer } from '~/zero/server'
import { insertAppThread } from '../models/app'
import {
  insertServerAppsChannel,
  insertServerDataChannel,
  insertServerTaskChannel,
} from '../models/helpers/insertServer'

export type ZeroMigration = {
  version: number
  name: string
  run: () => Promise<void>
}

export const migrations: ZeroMigration[] = [
  {
    version: 0,
    name: 'add-task-channels',
    run: async () => {
      await zeroServer.transaction(async (tx) => {
        await batchQuery(tx.query.server, async (servers) => {
          await Promise.all([
            servers.map((server) => {
              return insertServerTaskChannel(tx, server)
            }),
          ])
        })
      })
    },
  },

  {
    version: 1,
    name: 'add-apps-channels',
    run: async () => {
      await zeroServer.transaction(async (tx) => {
        await batchQuery(tx.query.server, async (servers) => {
          await Promise.all([
            servers.map(async (server) => {
              await insertServerAppsChannel(tx, server)
            }),
          ])
        })
      })
    },
  },

  {
    version: 2,
    name: 'add-data-channels',
    run: async () => {
      await zeroServer.transaction(async (tx) => {
        await batchQuery(tx.query.server, async (servers) => {
          await Promise.all([
            servers.map(async (server) => {
              await insertServerDataChannel(tx, server)
            }),
          ])
        })
      })
    },
  },

  {
    version: 15,
    name: 'add-app-threads',
    run: async () => {
      await zeroServer.transaction(async (tx) => {
        await batchQuery(tx.query.app, async (apps) => {
          await Promise.all([
            apps.map(async (app) => {
              const threadId = await insertAppThread(tx, app)
              if (threadId) {
                await tx.mutate.app.update({
                  id: app.id,
                  threadId,
                })
              }
            }),
          ])
        })
      })
    },
  },
]
