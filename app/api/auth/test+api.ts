import { authServer } from '~/features/auth/server/authServer'

export default async (req: Request) => {
  const out = await authServer.api.getSession({
    headers: req.headers,
  })

  console.info('got session', out)

  return Response.json(out)
}
