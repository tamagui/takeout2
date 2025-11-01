import { number, string, table } from '@rocicorp/zero'
import { mutations, where, type TableInsertRow } from 'over-zero'

export type UserProfile = TableInsertRow<typeof schema>

export const schema = table('userProfile')
  .columns({
    id: string(), // userId foreign key
    postsCount: number(),
  })
  .primaryKey('id')

const permissions = where('userProfile', (_, auth) => {
  return _.cmp('id', auth?.id || '')
})

export const mutate = mutations(schema, permissions, {
  // Initialize profile for new user
  initializeProfile: async ({ tx }, userId: string) => {
    await tx.mutate.userProfile.insert({
      id: userId,
      postsCount: 0,
    })
  },

  // Increment specific stat
  incrementStat: async (
    { tx, authData, can },
    stat: keyof Omit<UserProfile, 'id'>,
    amount = 1
  ) => {
    if (!authData) throw new Error('Not authenticated')
    await can(permissions, authData.id)

    const profile = await tx.query.userProfile.one().where('id', authData.id)
    if (!profile) throw new Error('User profile not found')

    const currentValue = profile[stat as keyof typeof profile] as number | undefined
    await tx.mutate.userProfile.update({
      id: authData.id,
      [stat]: (currentValue || 0) + amount,
    })
  },

  // Update multiple stats
  updateProfile: async (
    { tx, authData, can },
    updates: Partial<Omit<UserProfile, 'id'>>
  ) => {
    if (!authData) throw new Error('Not authenticated')
    await can(permissions, authData.id)

    await tx.mutate.userProfile.update({
      id: authData.id,
      ...updates,
    })
  },
})
