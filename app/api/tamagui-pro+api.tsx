import { and, eq } from 'drizzle-orm'
import type { Endpoint } from 'one'
import { literal, object, parse, string, union } from 'valibot'
import { adminAuthData } from '~/server/adminAuthData'
import { TAMAGUI_PRO_SECRET } from '~/server/env-server'
import { getDb } from '~/database'
import { user } from '~/database/schema-private'
import { role, serverMember, userRole } from '~/database/schema-public'

const validateBody = object({
  action: union([literal('add'), literal('remove')]),
  key: string(),
  email: string(),
})

export const POST: Endpoint = async (req) => {
  const body = await req.json()
  const { action, email, key } = parse(validateBody, body)
  const isValid = key === TAMAGUI_PRO_SECRET

  console.warn(`tamagui-pro ${isValid} ${action} ${email}`)

  if (!isValid) {
    return Response.json(
      { error: 'invalid secret', code: 'invalid_secret' },
      { status: 401 }
    )
  }

  if (action !== 'add') {
    return Response.json({ error: 'not implemented' }, { status: 400 })
  }

  const db = getDb()

  const userResult = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1)

  if (userResult.length === 0) {
    return Response.json({ error: 'No user found', code: 'no_user' }, { status: 400 })
  }

  const foundUser = userResult[0]
  if (!foundUser) {
    return Response.json({ error: 'No user found', code: 'no_user' }, { status: 400 })
  }

  // User onboarding is handled by the database and Zero mutations
  // This endpoint just ensures the user has the Pro role
  // The actual onboarding happens when they first sign in

  const userId = foundUser.id
  const serverId = 'tamagui'

  // check if the pro role exists
  const roleResult = await db
    .select({ id: role.id })
    .from(role)
    .where(and(eq(role.serverId, serverId), eq(role.name, 'Pro')))
    .limit(1)

  const foundRole = roleResult[0]
  if (!foundRole) {
    return Response.json(
      { error: 'Pro role not found', code: 'pro_role_not_found' },
      { status: 400 }
    )
  }

  const memberResult = await db
    .select({ serverId: serverMember.serverId })
    .from(serverMember)
    .where(and(eq(serverMember.serverId, serverId), eq(serverMember.userId, userId)))
    .limit(1)

  if (memberResult.length === 0) {
    await db.insert(serverMember).values({
      serverId,
      userId,
      joinedAt: new Date().toISOString(),
    })
  }

  const roleId = foundRole.id
  const userRoleResult = await db
    .select({ serverId: userRole.serverId })
    .from(userRole)
    .where(
      and(
        eq(userRole.serverId, serverId),
        eq(userRole.userId, userId),
        eq(userRole.roleId, roleId)
      )
    )
    .limit(1)

  if (userRoleResult.length === 0) {
    await db.insert(userRole).values({
      serverId,
      userId,
      roleId,
      granterId: userId,
      createdAt: new Date().toISOString(),
    })
  }

  return Response.json({ success: true })
}
