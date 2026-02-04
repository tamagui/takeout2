import { getAuthDataFromRequest } from '@take-out/better-auth-utils/server'

import { authServer } from '~/features/auth/server/authServer'
import { zeroServer } from '~/zero/server'

import type { Endpoint } from 'one'

// this sets up the synced queries endpoint
// see: https://zero.rocicorp.dev/docs/synced-queries

export const POST: Endpoint = async (request) => {
  try {
    const authData = await getAuthDataFromRequest(authServer, request)
    const { response } = await zeroServer.handleQueryRequest({
      authData,
      request,
    })
    return Response.json(response)
  } catch (err) {
    console.error(`[zero] pull+api error`, err)
    return Response.json({ err }, { status: 500 })
  }
}
