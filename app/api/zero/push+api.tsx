import {
  getAuthDataFromRequest,
  NotAuthenticatedError,
} from '@take-out/better-auth-utils/server'
import { handleSyncExecutorPushRequest } from 'orez-sync-executor'

import { authServer } from '~/features/auth/server/authServer'
import { zeroExecutor } from '~/zero/server'

import type { Endpoint } from 'one'

// see: https://zero.rocicorp.dev/docs/custom-mutators

export const POST: Endpoint = async (request) => {
  try {
    const authData = await getAuthDataFromRequest(authServer, request)
    return handleSyncExecutorPushRequest({
      executor: zeroExecutor,
      request,
      authData,
    })
  } catch (err) {
    if (err instanceof NotAuthenticatedError) {
      console.warn(`[zero] push+api not authenticated!`)
    } else {
      console.error(`[zero] push+api error`, err)
    }
    return Response.json({ err }, { status: 500 })
  }
}
