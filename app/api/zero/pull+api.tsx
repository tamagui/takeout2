import { getAuthDataFromRequest } from '~/features/auth/server/validateAuthHeader'
import { zeroServer } from '~/zero/server'

// this sets up the synced queries endpoint
// see: https://zero.rocicorp.dev/docs/synced-queries

import type { Endpoint } from 'one'

export const POST: Endpoint = async (request) => {
  try {
    const authData = await getAuthDataFromRequest(request)
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
