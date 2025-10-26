// this sets up custom server-side mutators
// see: https://zero.rocicorp.dev/docs/custom-mutators

import type { Endpoint } from 'one'
import type { AuthData } from '~/auth/types'
import { getAuthHeader, NotAuthenticatedError } from '~/auth/validateAuthHeader'
import { zeroServer } from '~/zero/server'

export const POST: Endpoint = async (request) => {
  try {
    const auth = await getAuthHeader(request)

    const authData: AuthData | null = auth
      ? {
          email: auth.email,
          id: auth.id,
          role: auth.role === 'admin' ? 'admin' : undefined,
        }
      : null

    const { response } = await zeroServer.handleMutationRequest({
      authData,
      request,
    })

    return Response.json(response)
  } catch (err) {
    if (err instanceof NotAuthenticatedError) {
      console.warn(`[zero] push+api not authenticated!`)
    } else {
      console.error(`[zero] push+api error`, err)
    }
    return Response.json({ err }, { status: 500 })
  }
}
