// import { ensureAuth } from '~/features/auth/server/ensureAuth'

export default async function OAuthEndpoint(req: Request): Promise<Response> {
  // TODO ensure this user has permission on this server
  // const auth = await ensureAuth(req)

  const { pathname, searchParams } = new URL(req.url)

  if (pathname.startsWith('/api/oauth/github')) {
    const { handleGitHubOAuth } = await import('~/apps/github/github-oauth')
    const response = await handleGitHubOAuth(pathname, searchParams, req)
    if (response) return response
  }

  if (pathname.startsWith('/api/oauth/stripe')) {
    const { handleStripeOAuth } = await import('~/apps/stripe/stripe-oauth')
    const response = await handleStripeOAuth(pathname, searchParams, req)
    if (response) return response
  }

  if (pathname.startsWith('/api/oauth/linear')) {
    const { handleLinearOAuth } = await import('~/apps/linear/linear-oauth')
    const response = await handleLinearOAuth(pathname, searchParams, req)
    if (response) return response
  }

  return new Response('Not found', { status: 404 })
}
