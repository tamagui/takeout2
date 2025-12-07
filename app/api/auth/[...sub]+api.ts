import { authAPIHandler } from '~/features/auth/server/apiHandler'

import type { Endpoint } from 'one'

export const GET: Endpoint = authAPIHandler('GET')
export const POST: Endpoint = authAPIHandler('POST')
