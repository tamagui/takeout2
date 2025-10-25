import { number, string, table } from '@rocicorp/zero'
import { mutations, where, type TableInsertRow } from 'over-zero'

export type UserStats = TableInsertRow<typeof schema>

export const schema = table('userStats')
  .columns({
    id: string(), // userId foreign key
    charactersCreated: number(),
    totalTokensHeld: number(),
    totalEarnings: number(),
    followersCount: number(),
    followingCount: number(),
    postsCount: number(),
    totalLikes: number(),
    updatedAt: number(),
  })
  .primaryKey('id')

export const permissions = where('userStats', (_, auth) => {
  return {
    read: true, // Everyone can read stats
    write: _.cmp('id', auth?.id || ''), // Only user can update their own stats
  }
})

export const mutate = mutations(schema, permissions, {
  // Initialize stats for new user
  initializeStats: async ({ tx }, userId: string) => {
    await tx.mutate.userStats.insert({
      id: userId,
      charactersCreated: 0,
      totalTokensHeld: 0,
      totalEarnings: 0,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      totalLikes: 0,
      updatedAt: Date.now(),
    })
  },

  // Increment specific stat
  incrementStat: async (
    { tx, authData, can },
    stat: keyof Omit<UserStats, 'id' | 'updatedAt'>,
    amount = 1
  ) => {
    if (!authData) throw new Error('Not authenticated')
    await can(permissions, 'write', authData.id)

    const stats = await tx.query.userStats.one().where('id', authData.id)
    if (!stats) throw new Error('User stats not found')

    await tx.mutate.userStats.update({
      id: authData.id,
      [stat]: (stats[stat] as number) + amount,
      updatedAt: Date.now(),
    })
  },

  // Update multiple stats
  updateStats: async (
    { tx, authData, can },
    updates: Partial<Omit<UserStats, 'id' | 'updatedAt'>>
  ) => {
    if (!authData) throw new Error('Not authenticated')
    await can(permissions, 'write', authData.id)

    await tx.mutate.userStats.update({
      id: authData.id,
      ...updates,
      updatedAt: Date.now(),
    })
  },
})
