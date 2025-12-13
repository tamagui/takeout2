import { eq } from 'drizzle-orm'

import { DEMO_EMAIL } from '~/constants/app'
import { getDb } from '~/database'
import { user as userTable, whitelist } from '~/database/schema-private'
import { userPublic, userState } from '~/database/schema-public'

export async function afterCreateUser(user: { id: string; email: string }) {
  try {
    const db = getDb()
    const userId = user.id
    const email = user.email

    console.info(`[afterCreateUser] Creating user records for ${email}`)

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
      console.info(`[afterCreateUser] User ${email} already exists`)
      return userPrivate
    }

    if (!userPrivate) {
      console.error(`[afterCreateUser] No user data found in private table for ${email}`)
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

    let { name, username, image, createdAt } = userPrivate

    // Check if user's email is in the whitelist
    const whitelistEntry = await db
      .select()
      .from(whitelist)
      .where(eq(whitelist.email, email))
      .limit(1)

    const isWhitelisted = whitelistEntry.length > 0

    // Handle admin promotion if needed
    if (email === 'admin@fleek.xyz') {
      // Uncomment if you need to promote to admin
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

    // Demo users are auto-onboarded for easier testing
    const isDemoUser = email === DEMO_EMAIL

    const userRow = {
      id: userId,
      name: name || '',
      username: isDemoUser ? 'demo' : username || '',
      image: image || '',
      joinedAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
      hasOnboarded: isDemoUser,
      whitelisted: isWhitelisted || isDemoUser,
      migrationVersion: 0,
      postsCount: 0,
    }

    console.info(`[afterCreateUser] Creating userPublic record`)
    await db.insert(userPublic).values(userRow)

    console.info(`[afterCreateUser] ✅ User ${email} setup complete`)
    return userPrivate
  } catch (error) {
    console.error(`[afterCreateUser] ❌ Error creating user records:`, error)
    throw error
  }
}
