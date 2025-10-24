import { boolean, number, string, table } from '@rocicorp/zero'
import { ensure } from '@vxrn/helpers'
import type { TableInsertRow } from 'over-zero'
import { ensureLoggedIn, mutations, where } from 'over-zero'

export type User = TableInsertRow<typeof schema>

export const schema = table('userPublic')
  .columns({
    id: string(),
    name: string(),
    username: string(),
    image: string(),
    lastActive: number().optional(),
    joinedAt: number(),
    hasOnboarded: boolean(),
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
  completeSignup: async ({ server, can }, userId: string) => {
    await can(permissions, 'write', userId)
    await server?.actions.user.onboardUser(userId)
  },

  createUserServer: async (ctx) => {
    if (ctx.server) {
      const authData = ensureLoggedIn()
      await ctx.server.actions.user.insertUserServer(ctx, authData.id)
    }
  },

  // we have two - global and per-channel, could maybe be reduced
  updatePresence: async (
    { tx, authData, can },
    { time, channelId }: { time: number; channelId: string }
  ) => {
    ensure(authData)
    const userId = authData.id
    await can(permissions, 'write', userId)
    await tx.mutate.userPublic.update({
      id: userId,
      lastActive: time,
    })
    await tx.mutate.channelActive.upsert({
      userId,
      channelId,
      lastSeenAt: time,
    })
  },

  updateProfile: async (
    { tx, authData, can, server },
    updates: {
      username?: string
      image?: string
      name?: string
    }
  ) => {
    ensure(authData)
    await can(permissions, 'write', authData.id)
    const userId = authData.id

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    )

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No fields to update')
    }

    // convert data URL to actual R2 upload
    if (server && filteredUpdates.image?.startsWith('data:')) {
      const { uploadDataUrlToR2 } = await import('~/features/upload/uploadDataUrl')
      filteredUpdates.image = await uploadDataUrlToR2(filteredUpdates.image)
    }

    await tx.mutate.userPublic.update({
      id: userId,
      ...filteredUpdates,
    })
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
