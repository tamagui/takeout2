import { prettyPrintResponse } from '@take-out/helpers'
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm'

import { getDb } from '~/database'
import * as schema from '~/database/schema'
import { ADMIN_WHITELIST } from '~/server/constants-server'

import { authServer } from './authServer'

export function authAPIHandler(method: 'GET' | 'POST') {
  return async (req: Request) => {
    try {
      const url = new URL(req.url)

      if (url.pathname.includes('/api/auth/sign-up/email')) {
        const clonedReq = req.clone()
        const body = await clonedReq.json()

        const res = await authServer.handler(req)

        if (res.status === 422) {
          console.info(`Sign-up attempt for existing email: ${body.email}`)

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
          console.info(
            `[auth] Auto sign-in for existing user ${signInRes.status}`,
            signInUrl
          )

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
      // detect jwks decryption error (secret mismatch)
      const isJwksError =
        err instanceof Error && err.message?.includes('Failed to decrypt private key')

      if (isJwksError) {
        console.error(`
╔═══════════════════════════════════════════════════════════════════════════╗
║  BETTER_AUTH_SECRET mismatch - JWKS encrypted with different secret       ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Fix: run \`bun tko db clear-jwks\` then restart the dev server            ║
╚═══════════════════════════════════════════════════════════════════════════╝
`)
        return new Response('JWKS secret mismatch - run: bun tko db clear-jwks', { status: 500 })
      }

      console.error(`[auth] Error in ${method} ${req.url}:`, err)
      if (err instanceof Error) {
        console.error('Error stack:', err.stack)
      }
      return new Response(`Error: ${err}`, { status: 500 })
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
  const now = new Date()

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
      or(isNull(schema.invite.expiresAt), gt(schema.invite.expiresAt, now.toISOString()))
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
  timestamp: Date
) {
  // Increment use count for the invite
  await db
    .update(schema.invite)
    .set({
      useCount: sql`${schema.invite.useCount} + 1`,
      usedAt: timestamp.toISOString(),
      usedBy: userId,
    })
    .where(eq(schema.invite.id, inviteId))
}
