import { randomId, slugify } from '@vxrn/helpers'
import { eq } from 'drizzle-orm'
import { context, type MutatorContext } from 'over-zero'
import { insertPrivateServer } from '~/data/models/helpers/insertPrivateServer'
import { insertServer } from '~/data/models/helpers/insertServer'
import { getDb } from '~/database'
import { getUserPrivate } from '~/database/helpers/getUserPrivate'
import { user as userTable } from '~/database/schema-private'
import { userPublic, userState } from '~/database/schema-public'
import { getIsAdmin } from '~/server/getIsAdmin'

export const userActions = {
  onboardUser,
  insertUserServer,
  getUserPrivate,
}

export async function onboardUser(userId: string) {
  const ctx = context()
  const userPrivate = await moveToUserPublic(ctx, userId)

  // TODO we should set a field or something
  const isBot = userPrivate?.email.endsWith('@start.chat')
  if (isBot) {
    // avoid rest of setup
    return
  }

  await processUserInvites(ctx, userId)
  await insertUserServer(ctx, userId)
  await setupServerPrivateChats(ctx, userId)
}

const moveToUserPublic = async ({ authData }: MutatorContext, userId: string) => {
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
      id: randomId(),
      userId,
    })
  }

  let { name, username, email, image, createdAt } = userPrivate

  if (email === 'admin@start.chat') {
    console.info(`Promoting to admin...`)
    image =
      'https://storage.start.chat/onechatimages/uploads/zx6urtz7ljg-/Users/n8/Desktop/5dvhtbozp9w-avatar.png'
    username = 'admin'
    await db
      .update(userTable)
      .set({
        role: 'admin',
        username: 'admin',
        image:
          'https://storage.start.chat/onechatimages/uploads/zx6urtz7ljg-/Users/n8/Desktop/5dvhtbozp9w-avatar.png',
      })
      .where(eq(userTable.id, userId))
  }

  // auto-generate username
  if (!username && name) {
    // for our bot we let it have duplicate username!
    if (username === 'hud' && email.endsWith('@start.chat')) {
      username = 'hud'
    } else {
      let generatedUsername = slugify(name)

      // check if username already exists
      const existingUsername = await db
        .select({ username: userPublic.username })
        .from(userPublic)
        .where(eq(userPublic.username, generatedUsername))
        .limit(1)

      if (existingUsername.length > 0) {
        // username exists, append random id
        generatedUsername = `${generatedUsername}-${randomId()}`
      }

      username = generatedUsername
    }
  }

  const userRow = {
    id: userId,
    name: name || '',
    username: username || '',
    image: image || '',
    joinedAt: createdAt,
    hasOnboarded: false,
  }

  await db.insert(userPublic).values(userRow)

  if (isAdmin) {
    await db.update(userTable).set({ role: 'admin' }).where(eq(userTable.id, userId))
  }

  return userPrivate
}

export async function insertUserServer({ tx }: MutatorContext, userId: string) {
  const existing = await tx.query.server.where('userId', userId).one()

  if (existing) {
    return
  }

  await insertServer(
    tx,
    {
      channelSort: [],
      createdAt: Date.now(),
      creatorId: userId,
      userId,
      description: '',
      icon: '',
      id: randomId(),
      name: '',
      state: {},
      isPrivateChat: false,
    },
    {
      withMainChannel: true,
      avoidAppsDataTasks: true,
    }
  )
}

const processUserInvites = async ({ tx }: MutatorContext, userId: string) => {
  // get user email from private user table
  const user = await getUserPrivate(userId)
  if (!user?.email) return

  // find any pending invites for this email that haven't expired
  const now = Date.now()
  const invites = await tx.query.invite
    .where('email', user.email)
    .where('accepted', false)
    .where('expiresAt', '>', now)

  for (const invite of invites) {
    // add user to server
    const existingMember = await tx.query.serverMember
      .where('serverId', invite.serverId)
      .where('userId', userId)
      .one()

    if (!existingMember) {
      // create server member
      await tx.mutate.serverMember.insert({
        userId,
        serverId: invite.serverId,
        hasClosedWelcome: false,
        joinedAt: now,
      })

      // if a role was specified, add the user to that role
      if (invite.roleId) {
        await tx.mutate.userRole.insert({
          userId,
          roleId: invite.roleId,
          serverId: invite.serverId,
          granterId: invite.inviterId,
          createdAt: now,
        })
      }
    }

    // mark invite as accepted
    await tx.mutate.invite.update({
      id: invite.id,
      accepted: true,
      acceptedAt: now,
      acceptedById: userId,
      updatedAt: now,
    })
  }
}

const setupServerPrivateChats = async ({ tx }: MutatorContext, userId: string) => {
  const user = await tx.query.userPublic.where('id', userId).one()

  if (!user) return

  // get all servers the user is a member of
  const userServers = await tx.query.serverMember.where('userId', userId)

  // get server details
  const serverIds = userServers.map((m) => m.serverId)
  if (serverIds.length === 0) {
    return
  }

  const servers = await tx.query.server
    .where('id', 'IN', serverIds)
    .where('isPrivateChat', '!=', true)

  // for each server, get the 10 most recently active users
  for (const server of servers) {
    const serverMembers = await tx.query.serverMember
      .where('serverId', server.id)
      .where('userId', '!=', userId)
      .limit(100) // get more initially

    // get user details for these members
    const memberUserIds = serverMembers.map((m) => m.userId)
    if (memberUserIds.length === 0) continue

    const users = await tx.query.userPublic.where('id', 'IN', memberUserIds)

    // sort by lastActive and take top 10
    const recentUsers = users
      .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0))
      .slice(0, 10)

    // create private servers for each recent user
    console.info(
      `Creating private chats migration from`,
      userId,
      'to',
      recentUsers.map((u) => u.id)
    )

    for (const recentUser of recentUsers) {
      await insertPrivateServer(tx, userId, recentUser.id, userId, Date.now())
    }
  }
}
