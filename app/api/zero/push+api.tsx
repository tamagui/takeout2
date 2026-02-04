import {
  getAuthDataFromRequest,
  NotAuthenticatedError,
} from '@take-out/better-auth-utils/server'

import { authServer } from '~/features/auth/server/authServer'
import { zeroServer } from '~/zero/server'

import type { Endpoint } from 'one'

// see: https://zero.rocicorp.dev/docs/custom-mutators

export const POST: Endpoint = async (request) => {
  try {
    const authData = await getAuthDataFromRequest(authServer, request)
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
