export const getJWTRequestCookie = (request: Request) => {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return null
  const cookies = cookieHeader.split('; ')
  const tokenCookie = cookies.find((c) => c.startsWith('better-auth.jwt='))
  if (!tokenCookie) return null
  const token = tokenCookie.split('=')[1]
  if (!token) return null
  return decodeURIComponent(token)
}
