import { getLastOTP } from '~/features/auth/server/lastOTP'

export async function GET(req: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not found', { status: 404 })
  }

  const url = new URL(req.url)
  const email = url.searchParams.get('email')

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const otp = getLastOTP(email)

  if (!otp) {
    return new Response(JSON.stringify({ error: 'No OTP found for this email' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ otp }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
