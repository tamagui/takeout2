import { json, number, string, table } from '@rocicorp/zero'
import { slugify } from '@vxrn/helpers'
import type { MutatorContext, TableInsertRow, TableUpdateRow } from 'over-zero'
import { ensureLoggedIn, mutations, where } from 'over-zero'
import type { AppInstallSettings } from 'start/types'
import { APP_DATA_WEBHOOK_KEY } from '~/features/apps/constants'
import type { App } from '../models'
import { hasServerAdminPermission } from '../where/server'
import { insertTaskThread, type Task } from './task'

export type AppInstall = TableInsertRow<typeof schema>
export type AppInstallUpdate = TableUpdateRow<typeof schema>

export const schema = table('appInstall')
  .columns({
    id: string(),
    appId: string(),
    channelId: string().optional(),
    createdAt: number(),
    creatorId: string(),
    settings: json<AppInstallSettings>().optional(),
    serverId: string(),
    threadId: string().optional(),
    messageId: string().optional(),
  })
  .primaryKey('id')

const hasServerEditAppPermission = where<'appInstall'>((_, auth) => {
  return _.exists('server', (q) =>
    q.whereExists('role', (q) =>
      q
        .where('canEditApp', true)
        .whereExists('member', (q) => q.where('id', auth?.id || ''))
    )
  )
})

const hasAppInstallPermission = where<'appInstall'>((_, auth) => {
  return _.exists('appInstallPermissions', (q) =>
    q.whereExists('role', (q) =>
      q.whereExists('member', (q) => q.where('id', auth?.id || ''))
    )
  )
})

export const permissions = where('appInstall', (_, auth) => {
  return {
    read: _.or(hasServerAdminPermission(_, auth), hasAppInstallPermission(_, auth)),
    write: hasServerEditAppPermission(_, auth),
  }
})

export const mutate = mutations(schema, permissions, {
  insert: async (ctx, appInstall: AppInstall) => {
    const { tx, server } = ctx
    const authData = ensureLoggedIn()

    await tx.mutate.appInstall.insert(appInstall)

    if (server) {
      await Promise.all([
        (async () => {
          const teamRole = await tx.query.role
            .where('serverId', appInstall.serverId)
            .where('name', 'Team')
            .one()
          if (teamRole) {
            await tx.mutate.appInstallPermission.insert({
              id: `${appInstall.id}-permission`,
              appInstallId: appInstall.id,
              serverId: appInstall.serverId,
              roleId: teamRole.id,
              granterId: authData.id,
              createdAt: appInstall.createdAt || Date.now(),
            })
          }
        })(),
        ensureDefaultTasks(ctx, appInstall),
        ensureDefaultWebhook(ctx, appInstall),
      ])
    }
  },

  async update(ctx, next: AppInstallUpdate) {
    const { tx, server } = ctx
    await tx.mutate.appInstall.update(next)

    if (server) {
      const appInstall = await tx.query.appInstall.where('id', next.id).one()
      if (appInstall) {
        await ensureDefaultTasks(ctx, appInstall)
        await ensureDefaultWebhook(ctx, appInstall)
      }
    }
  },
})

function hasRequiredAppOptions(app: App, appInstall: AppInstall) {
  const appMeta = app.meta
  const values = {
    ...app.meta?.optionsDefaults,
    ...appInstall.settings?.options,
  }
  if (!appMeta || !appMeta.options || !appMeta.optionsRequired) {
    return true
  }
  for (const key in appMeta.optionsRequired) {
    if (values[key] == null) {
      return false
    }
  }
  return true
}

async function ensureDefaultWebhook(
  { authData, tx, server }: MutatorContext,
  appInstall: AppInstall
) {
  if (!authData) return
  const app = await tx.query.app.where('id', appInstall.appId).one()
  if (!app?.meta?.actions) return
  if (!appInstall.serverId) return
  if (!hasRequiredAppOptions(app, appInstall)) return

  const existing = await tx.query.data
    .where('appInstallId', appInstall.id)
    .where('key', 'LIKE', `${APP_DATA_WEBHOOK_KEY}%`)
    .one()

  if (existing) return

  const subscribeAction = app?.meta?.actions?.find((a) => a.name === 'subscribe')

  // automatically subscribe the default webhook
  if (subscribeAction) {
    await server?.actions.app.runApp({
      appId: app.id,
      serverId: appInstall.serverId,
      userId: authData.id,
      action: {
        name: 'subscribe',
        message: '',
      },
    })
  }
}

async function ensureDefaultTasks(
  { tx, authData }: MutatorContext,
  appInstall: AppInstall
) {
  const app = await tx.query.app.where('id', appInstall.appId).one()
  if (!app?.meta?.defaultTasks) return
  if (!hasRequiredAppOptions(app, appInstall)) return
  if (!authData) return

  for (const task of app.meta.defaultTasks) {
    const id = `${appInstall.id}-${slugify(task.name)}-task`

    // ensure not existing
    if (await tx.query.task.where('id', id).one()) {
      continue
    }

    const taskInsert: Task = {
      id,
      creatorId: authData?.id,
      name: task.name,
      serverId: appInstall.serverId,
      steps: [
        {
          action: task.action,
          app: app.id,
          message: '',
        },
      ],
      trigger: 'schedule',
      numSteps: 1,
      schedule: task.schedule,
      appInstallId: appInstall.id,
      createdAt: appInstall.createdAt,
    }

    const threadId = await insertTaskThread(tx, taskInsert)
    await tx.mutate.task.insert({
      ...taskInsert,
      threadId,
    })
  }
}
