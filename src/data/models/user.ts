import { boolean, json, number, string, table } from '@rocicorp/zero'
import { ensure } from '@vxrn/helpers'
import type { TableInsertRow, TableUpdateRow } from 'over-zero'
import { ensureLoggedIn, mutations, where } from 'over-zero'

export type User = TableInsertRow<typeof schema>
export type UserUpdate = TableUpdateRow<typeof schema>
export type UserSocialLinks = Record<string, string>

export const schema = table('userPublic')
  .columns({
    id: string(),
    name: string(),
    username: string(),
    image: string(),
    bio: string().optional(),
    ranking: number().optional(),
    walletAddress: string().optional(),
    socialLinks: json<UserSocialLinks>().optional(),
    lastActive: number().optional(),
    joinedAt: number(),
    hasOnboarded: boolean(),
    whitelisted: boolean(),
    migrationVersion: number(),
  })
  .primaryKey('id')

export const permissions = where('userPublic', (_, auth) => {
  return {
    read: true,
    write: _.or(
      // indent
      _.cmpLit(auth?.role || '', '=', 'admin'),
      _.cmp('id', auth?.id || '')
    ),
  }
})

export const mutate = mutations(schema, permissions, {
  completeSignup: async ({ server, authData, tx }, userId: string) => {
    ensure(authData)

    if (server) {
      server.asyncTasks.push(async () => {
        if (await server.actions.userActions.onboardUser(tx, authData, userId)) {
          await server.actions
            .analyticsActions()
            .logEvent(authData.id, 'user_onboarded', {
              userId: authData.id,
              hasCompletedProfile: true,
            })
        }
      })
    }
  },

  validateUsername: async ({ environment, server, tx }, username: string) => {
    if (environment === 'server' && server) {
      await server.actions.userActions.validateUsername(tx, username)
    }
  },

  update: async ({ authData, can, tx, environment, server }, user: UserUpdate) => {
    ensure(authData)
    await can(permissions, 'write', authData.id)

    // Create a mutable copy for modification
    let updateData = { ...user }

    // convert data URL to actual R2 upload
    if (server && updateData.image?.startsWith('data:')) {
      const { uploadDataUrlToR2 } = await import('~/features/upload/uploadDataUrl')
      updateData.image = await uploadDataUrlToR2(updateData.image)
    }

    if (environment === 'server' && server && updateData.username) {
      await server.actions.userActions.validateUsername(tx, updateData.username)
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
    await can(permissions, 'write', authData.id)

    // only perform deletion on server
    if (environment === 'server' && server) {
      // server will handle deletion of all user data
      // except for likes and follows as specified
      await server.actions.userActions.deleteAccount(tx, authData.id)
    }
  },

  whitelistUsers: async ({ authData, tx, environment, server }, emails: string[]) => {
    ensure(authData)

    // only perform on server
    if (environment === 'server' && server) {
      // Use serverActions to whitelist users by email
      await server.actions.userActions.whitelistUsers(tx, emails)
    }
  },

  finishOnboarding: async ({ tx, can, authData }) => {
    ensure(authData)
    await can(permissions, 'write', authData.id)
    await tx.mutate.userPublic.update({
      id: authData.id,
      hasOnboarded: true,
    })
  },
})
