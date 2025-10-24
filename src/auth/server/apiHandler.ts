import { and, eq, gt } from 'drizzle-orm'
import { getDb } from '~/database'
import * as schema from '~/database/schema'
import { prettyPrintResponse } from '@vxrn/helpers'
import { ADMIN_WHITELIST } from '~/server/constants-server'
import { authServer } from './authServer'

export function authAPIHandler(method: 'GET' | 'POST') {
  return async (req: Request) => {
    try {
      const res = await authServer.handler(req)
      console.info(`[auth] ${method} ${res.status}`, req.url)

      const processedResponse = await handleAuthCallback(req, res)

      if (process.env.DEBUG || processedResponse.status >= 400) {
        prettyPrintResponse(processedResponse)
      }

      return processedResponse
    } catch (err) {
      console.error(`Error: ${err}`)
      return new Response(`Error`, { status: 500 })
    }
  }
}

async function handleAuthCallback(req: Request, res: Response): Promise<Response> {
  const url = new URL(req.url)

  const isAuthCallback =
    url.pathname.startsWith('/api/auth/magic-link/verify') ||
    url.pathname.startsWith('/api/auth/callback/')

  if (!isAuthCallback || res.status !== 302) {
    return res
  }

  const sessionToken = res.headers.get('set-auth-token')
  if (!sessionToken) {
    return res
  }

  const session = await getSessionFromToken(req, sessionToken)
  if (!session?.user) {
    return res
  }

  const user = session.user
  const email = user.email?.toLowerCase()
  const accessResult = await checkUserAccess(email, user.id, user.role || undefined)

  if (!accessResult.allowed) {
    const redirectUrl = new URL('/_/login', req.url)
    redirectUrl.searchParams.set('notAllowed', '1')
    return createRedirectResponse(res, redirectUrl)
  }

  if (accessResult.serverId) {
    const redirectUrl = new URL(res.headers.get('location') || '/', req.url)
    redirectUrl.pathname = `/${accessResult.serverId}`
    return createRedirectResponse(res, redirectUrl)
  }

  return res
}

async function getSessionFromToken(req: Request, sessionToken: string) {
  const sessionHeaders = new Headers(req.headers)
  sessionHeaders.set('cookie', `better-auth.session_token=${sessionToken}`)

  return authServer.api.getSession({ headers: sessionHeaders })
}

function createRedirectResponse(originalResponse: Response, redirectUrl: URL): Response {
  return new Response(null, {
    status: 302,
    headers: {
      ...Object.fromEntries(originalResponse.headers.entries()),
      location: redirectUrl.toString(),
    },
  })
}

async function checkUserAccess(
  email: string | undefined,
  userId: string,
  role?: string
): Promise<{ allowed: boolean; serverId?: string }> {
  if (!email) {
    return { allowed: false }
  }

  if (ADMIN_WHITELIST.has(email) || role === 'admin') {
    return { allowed: true }
  }

  const db = getDb()
  const now = Date.now()

  const acceptedInvite = await db.query.invite.findFirst({
    where: and(eq(schema.invite.email, email), eq(schema.invite.accepted, true)),
  })

  if (acceptedInvite) {
    return { allowed: true, serverId: acceptedInvite.serverId }
  }

  const validInvite = await db.query.invite.findFirst({
    where: and(
      eq(schema.invite.email, email),
      eq(schema.invite.accepted, false),
      gt(schema.invite.expiresAt, new Date(now).toISOString())
    ),
  })

  if (validInvite) {
    await acceptInvite(db, validInvite.id, userId, now)

    return {
      allowed: true,
      serverId: validInvite.serverId,
    }
  }

  const privateBetaInvite = await db.query.privateBetaInvite.findFirst({
    where: eq(schema.privateBetaInvite.email, email),
  })

  if (privateBetaInvite) {
    return { allowed: true }
  }

  return { allowed: false }
}

async function acceptInvite(
  db: ReturnType<typeof getDb>,
  inviteId: string,
  userId: string,
  timestamp: number
) {
  await db
    .update(schema.invite)
    .set({
      accepted: true,
      acceptedAt: new Date(timestamp).toISOString(),
      acceptedById: userId,
      updatedAt: new Date(timestamp).toISOString(),
    })
    .where(eq(schema.invite.id, inviteId))
}
