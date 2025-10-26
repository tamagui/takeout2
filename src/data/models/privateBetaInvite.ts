import { boolean, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'

export type PrivateBetaInvite = TableInsertRow<typeof schema>

export const schema = table('privateBetaInvite')
  .columns({
    id: string(),
    email: string(),
    accepted: boolean(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('id')

export const permissions = where('privateBetaInvite', () => {
  return {
    read: false,
    write: false,
  }
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, server }, privateBetaInvite: PrivateBetaInvite) => {
    await tx.mutate.privateBetaInvite.insert(privateBetaInvite)

    // Email functionality removed
  },
})
