import { number, string, table } from '@rocicorp/zero'
import { mutations, where } from 'over-zero'
import type { UserProfile } from '../types'

export const schema = table('userProfile')
  .columns({
    id: string(), // userId
    postsCount: number(),
  })
  .primaryKey('id')

const permissions = where('userProfile', (_, auth) => {
  return _.cmp('id', auth?.id || '')
})

export const mutate = mutations(schema, permissions, {
  initializeProfile: async ({ tx, authData, can }, userId: string) => {
    if (!authData) throw new Error('Not authenticated')
    await can(permissions, authData.id)
    await tx.mutate.userProfile.insert({
      id: userId,
      postsCount: 0,
    })
  },

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
