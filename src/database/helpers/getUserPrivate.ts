import { eq } from 'drizzle-orm'
import { getDb } from '~/database'
import { user } from '../schema-private'
import type { UserPrivate } from '../schema-private'

export async function getUserPrivate(userId: string): Promise<UserPrivate | null> {
  const db = getDb()

  const result = await db.select().from(user).where(eq(user.id, userId)).limit(1)

  return result[0] || null
}
