import { json, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'

export type Reaction = TableInsertRow<typeof schema>

export const schema = table('reaction')
  .columns({
    id: string(),
    value: string(),
    keyword: string(),
    category: string(),
    keywords: json<string[]>(),
    image: string().optional(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('id')

export const permissions = where('reaction', () => {
  return {
    read: true, // anyone can read reactions
    write: false, // only server can write reactions
  }
})

export const mutate = mutations(schema, permissions, {})
