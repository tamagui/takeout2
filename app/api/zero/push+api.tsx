import {
  getAuthHeader,
  NotAuthenticatedError,
} from '~/features/auth/server/validateAuthHeader'
import { zeroServer } from '~/zero/server'

// this sets up custom server-side mutators
// see: https://zero.rocicorp.dev/docs/custom-mutators

import type { Endpoint } from 'one'
import type { AuthData } from '~/features/auth/types'

export const POST: Endpoint = async (request) => {
  try {
    const auth = await getAuthHeader(request)

    // use sub as fallback for id (standard JWT uses sub for subject/user id)
    const userId = auth?.id || auth?.sub
    const authData: AuthData | null =
      auth && userId
        ? {
            email: auth.email,
            id: userId as string,
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
