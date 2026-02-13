import { prettyPrintResponse } from '@take-out/helpers'

import { authServer } from './authServer'

export function authAPIHandler(method: 'GET' | 'POST') {
  return async (req: Request) => {
    const url = new URL(req.url)

    // auto handle sign-up => sign-in for passwords
    if (url.pathname.includes('/api/auth/sign-up/email')) {
      const clonedReq = req.clone()
      const body = await clonedReq.json()

      const res = await authServer.handler(req)

      // user already exists, auto sign-in instead
      if (res.status === 422) {
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
        if (process.env.DEBUG || signInRes.status >= 400) {
          prettyPrintResponse(signInRes)
        }

        return signInRes
      }

      if (process.env.DEBUG || res.status >= 400) {
        prettyPrintResponse(res)
      }

      return res
    }

    // handle all other auth endpoints
    const res = await authServer.handler(req)

    if (process.env.DEBUG || res.status >= 400) {
      console.info(`[auth] ${method} ${res.status}`, req.url)
      prettyPrintResponse(res)
    }

    return res
  }
}
