import { eq, ne, and } from 'drizzle-orm'

import { getDb } from '~/database'
import { user as userTable, whitelist } from '~/database/schema-private'
import { post, userPublic, userState } from '~/database/schema-public'
import { getIsAdmin } from '~/server/getIsAdmin'

import type { AuthData } from '~/features/auth/types'

export const userActions = {
  onboardUser,
  validateUsername,
  deleteAccount,
  whitelistUsers,
}

async function onboardUser(authData: AuthData, userId: string) {
  if (!authData) return

  const isAdmin = getIsAdmin(authData)
  const db = getDb()

  // check if user exists in userPublic table
  const existingUser = await db
    .select()
    .from(userPublic)
    .where(eq(userPublic.id, userId))
    .limit(1)

  // get user data from private user table
  const [userPrivate] = await db
    .select({
      name: userTable.name,
      username: userTable.username,
      email: userTable.email,
      image: userTable.image,
      createdAt: userTable.createdAt,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))

  if (existingUser.length === 1) {
    return userPrivate
  }

  if (!userPrivate) {
    return
  }

  // check if userState exists, if not create it with defaults
  const existingUserState = await db
    .select()
    .from(userState)
    .where(eq(userState.userId, userId))
    .limit(1)

  if (existingUserState.length === 0) {
    await db.insert(userState).values({
      userId,
      darkMode: false,
      locale: 'en',
      timeZone: 'UTC',
      onlineStatus: 'online',
    })
  }

  let { name, username, email, image, createdAt } = userPrivate

  // Check if user's email is in the whitelist
  const whitelistEntry = await db
    .select()
    .from(whitelist)
    .where(eq(whitelist.email, email))
    .limit(1)

  const isWhitelisted = whitelistEntry.length > 0

  if (email === 'admin@fleek.xyz') {
    // if you need to promote to admin
    // console.info(`Promoting to admin...`)
    // image = 'https://your-admin-image-url'
    // username = 'admin'
    // await db
    //   .update(userTable)
    //   .set({
    //     role: 'admin',
    //     username: 'admin',
    //     image: 'https://your-admin-image-url',
    //   })
    //   .where(eq(userTable.id, userId))
  }

  const userRow = {
    id: userId,
    name: name || '',
    username: username || '',
    image: image || '',
    joinedAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
    hasOnboarded: false,
    whitelisted: isWhitelisted,
    migrationVersion: 0,
    postsCount: 0,
  }

  await db.insert(userPublic).values(userRow)

  if (isAdmin) {
    await db.update(userTable).set({ role: 'admin' }).where(eq(userTable.id, userId))
  }

  return userPrivate
}

async function deleteAccount(userId: string) {
  const db = getDb()

  try {
    // delete all user-generated content
    await db.delete(post).where(eq(post.userId, userId))

    // delete user state
    await db.delete(userState).where(eq(userState.userId, userId))

    // delete user from private user table (authentication data)
    await db.delete(userTable).where(eq(userTable.id, userId))

    // delete user from userPublic table (public profile)
    // This will prevent the "Deleted User" name from appearing when recreating account
    await db.delete(userPublic).where(eq(userPublic.id, userId))
  } catch (error) {
    console.error(`Failed to delete account for user ${userId}:`, error)
    throw new Error('Failed to delete account')
  }
}

async function validateUsername(username?: string, excludeUserId?: string) {
  if (!username) return

  if (username.length < 3) {
    throw new Error('Username must be at least 3 characters')
  }

  if (username.length > 30) {
    throw new Error('Username must be less than 30 characters')
  }

  // Check if username matches allowed pattern (alphanumeric, underscore, hyphen)
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    throw new Error(
      'Username can only contain letters, numbers, underscores, and hyphens'
    )
  }

  const db = getDb()

  // Check if username is already taken by another user
  const whereCondition = excludeUserId
    ? and(eq(userPublic.username, username), ne(userPublic.id, excludeUserId))
    : eq(userPublic.username, username)

  const existingUser = await db.select().from(userPublic).where(whereCondition).limit(1)

  if (existingUser.length > 0) {
    throw new Error('Username is already taken')
  }

  return true
}

async function whitelistUsers(emails: string[]) {
  const db = getDb()

  const uniqueEmails = [...new Set(emails.map((e) => e.toLowerCase()))]

  const whitelistEntries = uniqueEmails.map((email) => ({
    id: crypto.randomUUID(),
    email,
  }))

  try {
    const inserted = await db
      .insert(whitelist)
      .values(whitelistEntries)
      .onConflictDoNothing()
      .returning()

    // Update existing users who now match the whitelist
    for (const email of uniqueEmails) {
      const users = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1)

      for (const user of users) {
        await db
          .update(userPublic)
          .set({ whitelisted: true })
          .where(eq(userPublic.id, user.id))
      }
    }

    console.info(
      `Whitelisted ${inserted.length} new users (${uniqueEmails.length - inserted.length} already existed)`
    )
  } catch (error) {
    console.error('Failed to whitelistUsers', error)
  }
}
