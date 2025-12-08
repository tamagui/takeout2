import { authServer } from './authServer'

export class NotAuthorizedError extends Error {}

export async function ensureAuth(req: Request, role?: 'admin') {
  const session = await authServer.api.getSession({
    headers: req.headers,
  })

  if (!session) {
    console.warn(`Not authorized: ${req.url}, no session`)
    for (const [key, value] of req.headers.entries()) {
      console.warn(`header: ${key} = ${value}`)
    }
    throw Response.json(
      {
        error: `Not authorized`,
      },
      {
        status: 401,
      }
    )
  }

  if (role && session.user.role !== role) {
    console.warn(`Not authorized: ${req.url}, not role ${role}`)
    throw Response.json(
      {
        error: `Not authorized`,
      },
      {
        status: 403,
      }
    )
  }

  return session
}
