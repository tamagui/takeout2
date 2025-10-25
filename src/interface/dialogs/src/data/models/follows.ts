import { number, string, table } from '@rocicorp/zero'
import { mutations, where, type TableInsertRow } from 'over-zero'

export type Follows = TableInsertRow<typeof schema>

export const schema = table('follows')
  .columns({
    id: string(),
    followerId: string(), // user who is following
    followingId: string(), // user being followed
    createdAt: number(),
  })
  .primaryKey('id')

export const permissions = where('follows', (_, auth) => {
  return {
    read: true, // Everyone can see follow relationships
    write: _.cmp('followerId', auth?.id || ''), // Only follower can create/delete their follows
  }
})

export const mutate = mutations(schema, permissions, {
  follow: async ({ tx, authData, environment, server }, targetUserId: string) => {
    if (!authData) throw new Error('Not authenticated')
    if (authData.id === targetUserId) throw new Error('Cannot follow yourself')

    const existing = await tx.query.follows
      .where('followerId', authData.id)
      .where('followingId', targetUserId)
      .one()

    if (existing) throw new Error('Already following this user')

    const followId = `${authData.id}_${targetUserId}`

    await tx.mutate.follows.insert({
      id: followId,
      followerId: authData.id,
      followingId: targetUserId,
      createdAt: Date.now(),
    })

    if (environment === 'server' && server) {
      server.asyncTasks.push(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'user_followed', {
          targetUserId,
        })
      )
    }
  },

  unfollow: async ({ tx, authData, environment, server }, targetUserId: string) => {
    if (!authData) throw new Error('Not authenticated')

    const followId = `${authData.id}_${targetUserId}`
    const existing = await tx.query.follows.where('id', followId).one()

    if (!existing) throw new Error('Not following this user')

    await tx.mutate.follows.delete({ id: followId })

    if (environment === 'server' && server) {
      server.asyncTasks.push(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'user_unfollowed', {
          targetUserId,
        })
      )
    }
  },
})
