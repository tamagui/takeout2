import { boolean, number, string, table } from '@rocicorp/zero'
import { ensure } from '@take-out/helpers'
import { mutations, serverWhere } from 'on-zero'

import type { UserUpdate } from '../types'

export const schema = table('userPublic')
  .columns({
    id: string(),
    name: string().optional(),
    username: string().optional(),
    image: string().optional(),
    joinedAt: number(),
    hasOnboarded: boolean(),
    whitelisted: boolean(),
    migrationVersion: number(),
    postsCount: number(),
  })
  .primaryKey('id')

const permissions = serverWhere('userPublic', (_, auth) => {
  return _.or(_.cmpLit(auth?.role || '', '=', 'admin'), _.cmp('id', auth?.id || ''))
})

export const mutate = mutations(schema, permissions, {
  completeSignup: async ({ server, authData, tx }, userId: string) => {
    ensure(authData)

    await tx.mutate.userPublic.update({
      id: userId,
      hasOnboarded: true,
    })

    if (process.env.VITE_ENVIRONMENT === 'ssr' && server) {
      server.asyncTasks.push(async () => {
        await server.actions.analyticsActions().logEvent(authData.id, 'user_onboarded', {
          userId: authData.id,
          hasCompletedProfile: true,
        })
      })
    }
  },

  validateUsername: async ({ environment, server, tx }, username: string) => {
    if (environment === 'server' && server) {
      await server.actions.userActions.validateUsername(username)
    }
  },

  update: async ({ authData, can, tx, environment, server }, user: UserUpdate) => {
    ensure(authData)
    await can(permissions, authData.id)

    // Create a mutable copy for modification
    let updateData = { ...user }

    // convert data URL to actual R2 upload (server-only to avoid bundling AWS SDK on client)
    if (
      process.env.VITE_ENVIRONMENT === 'ssr' &&
      server &&
      updateData.image?.startsWith('data:')
    ) {
      const { uploadDataUrlToR2 } = await import('~/features/upload/uploadDataUrl')
      updateData.image = await uploadDataUrlToR2(updateData.image)
    }

    if (environment === 'server' && server && updateData.username) {
      await server.actions.userActions.validateUsername(updateData.username, authData.id)
    }

    await tx.mutate.userPublic.update(updateData)

    if (environment === 'server' && server) {
      const fieldsUpdated = Object.keys(user).filter((key) => key !== 'id')
      server.asyncTasks.push(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'profile_updated', {
          fieldsUpdated,
        })
      )
    }
  },

  delete: async ({ authData, server, can, environment, tx }, _user: UserUpdate) => {
    ensure(authData)
    await can(permissions, authData.id)

    // only perform deletion on server
    if (environment === 'server' && server) {
      // server will handle deletion of all user data
      // except for likes and follows as specified
      await server.actions.userActions.deleteAccount(authData.id)
    }
  },

  whitelistUsers: async ({ authData, tx, environment, server }, emails: string[]) => {
    ensure(authData)

    // only perform on server
    if (environment === 'server' && server) {
      // Use serverActions to whitelist users by email
      await server.actions.userActions.whitelistUsers(emails)
    }
  },

  finishOnboarding: async ({ tx, can, authData }) => {
    ensure(authData)
    await can(permissions, authData.id)
    await tx.mutate.userPublic.update({
      id: authData.id,
      hasOnboarded: true,
    })
  },
})
