import { prettyPrintResponse } from '@vxrn/helpers'
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm'
import { getDb } from '~/database'
import * as schema from '~/database/schema'
import { ADMIN_WHITELIST } from '~/server/constants-server'
import { authServer } from './authServer'

export function authAPIHandler(method: 'GET' | 'POST') {
  return async (req: Request) => {
    try {
      const url = new URL(req.url)

      // Handle sign-up for existing users - automatically try to sign in instead
      if (url.pathname.includes('/api/auth/sign-up/email')) {
        const res = await authServer.handler(req)

        // If sign-up fails because user already exists (422), try to sign them in
        if (res.status === 422) {
          const body = await req.clone().json()
          console.info(`Sign-up attempt for existing email: ${body.email}`)

          // Attempt to sign in with the same credentials
          const signInUrl = url.toString().replace('/sign-up/email', '/sign-in/email')
          const signInReq = new Request(signInUrl, {
            method: 'POST',
            headers: req.headers,
            body: JSON.stringify({
              email: body.email,
              password: body.password,
            }),
          })

          const signInRes = await authServer.handler(signInReq)
          console.info(`[auth] Auto sign-in for existing user ${signInRes.status}`, signInUrl)

          if (process.env.DEBUG || signInRes.status >= 400) {
            prettyPrintResponse(signInRes)
          }

          return signInRes
        }

        console.info(`[auth] ${method} ${res.status}`, req.url)

        if (process.env.DEBUG || res.status >= 400) {
          prettyPrintResponse(res)
        }

        return res
      }

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

  // Check if user has a valid invite
  const validInvite = await db.query.invite.findFirst({
    where: and(
      or(
        eq(schema.invite.email, email),
        isNull(schema.invite.email) // code-only invites
      ),
      or(
        gt(schema.invite.maxUses, schema.invite.useCount),
        eq(schema.invite.maxUses, -1) // unlimited uses
      ),
      or(isNull(schema.invite.expiresAt), gt(schema.invite.expiresAt, now))
    ),
  })

  if (validInvite) {
    await acceptInvite(db, validInvite.id, userId, now)
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
  // Increment use count for the invite
  await db
    .update(schema.invite)
    .set({
      useCount: sql`${schema.invite.useCount} + 1`,
      usedAt: timestamp,
      usedBy: userId,
    })
    .where(eq(schema.invite.id, inviteId))
}
