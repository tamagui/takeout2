import { json, number, string, table } from '@rocicorp/zero'
import { ensure, sleep } from '@vxrn/helpers'
import type { TableInsertRow, TableUpdateRow, Transaction } from 'over-zero'
import { mutations, where } from 'over-zero'
import type { AppMeta, AppType } from 'start/types'
import { createMessageOrder } from '~/features/message/createMessageOrder'

export type App = TableInsertRow<typeof schema>
export type AppUpdate = TableUpdateRow<typeof schema>

export const schema = table('app')
  .columns({
    id: string(),
    creatorId: string(),
    serverId: string().optional(),
    threadId: string().optional(),
    type: string<AppType>().optional(),
    meta: json<AppMeta>().optional(),
    installCount: number().optional(),
    description: string().optional(),
    name: string().optional(),
    version: string().optional(),
    source: string().optional(),
    backendSource: string().optional(),
    complicationSource: string().optional(),
    frontendSource: string().optional(),
    image: string().optional(),
    updatedAt: number().optional(),
    createdAt: number(),
  })
  .primaryKey('id')

export const permissions = where('app', (_, auth) => {
  const userId = auth?.id || ''

  // TODO this is not right because we need channel need to enforce add channelId to apps generated
  // NOTE this also slowed queries down a lot so pausing
  // ALSO - shouldn't we have access to the current "app" object to do comparisons?
  // const isUserRoleOnServer = _.cmpLit('1', '=', '1') // allow
  // _.exists('server', (q) =>
  //   q.whereExists('role', (q) => q.whereExists('member', (q) => q.where('id', userId)))
  // )

  return {
    // read: _.or(_.cmp('type', '=', 'global'), isUserRoleOnServer),
    read: true,
    write: _.exists('server', (server) => {
      return server.where((_) =>
        _.or(
          _.cmp('creatorId', userId),
          _.cmp('userId', userId),
          _.exists('role', (q) =>
            q
              .where((_) =>
                _.or(
                  _.cmp('canAdmin', true),
                  _.cmp('canEditChannel', true),
                  _.cmp('canEditServer', true)
                )
              )
              .whereExists('member', (q) => q.where('id', userId))
          )
        )
      )
    }),
  }
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx }, app: App) => {
    let appToInsert = { ...app }
    appToInsert.threadId = await insertAppThread(tx, app)
    await tx.mutate.app.upsert(appToInsert)
  },

  migrate: async ({ server }) => {
    await server?.actions.app.migrateInitialApps()
  },

  createDefaultWebhook: async (
    { server, authData },
    { appId, serverId }: { appId: string; serverId: string }
  ) => {
    ensure(authData)
    await server?.actions.app.runApp({
      appId,
      serverId,
      userId: authData.id,
      action: {
        message: '',
        name: 'subscribe',
      },
    })
  },
})

export async function insertAppThread(tx: Transaction, app: App) {
  if (app.threadId) return app.threadId
  if (!app.serverId) return null
  if (app.type !== 'generated') return null

  // ensure we always have a thread for every app to show in apps channel
  const channelId = `${app.serverId}-apps`
  const messageId = `${app.id}-app`
  const threadId = `${app.id}-app`

  await tx.mutate.message.insert({
    id: messageId,
    channelId,
    serverId: app.serverId,
    content: '',
    createdAt: app.createdAt,
    creatorId: app.creatorId,
    deleted: false,
    isThreadReply: false,
    order: createMessageOrder(),
    type: 'hidden',
  })

  // TODO zero bug
  await sleep(250)

  await tx.mutate.thread.insert({
    id: threadId,
    createdAt: app.createdAt,
    creatorId: app.creatorId,
    deleted: false,
    messageId,
    channelId,
    replyCount: 0,
    serverId: app.serverId,
    title: app.name || 'App',
  })

  console.info('done', threadId)

  return threadId
}
