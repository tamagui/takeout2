import { handleQueryRequest as zeroHandleQueryRequest } from '@rocicorp/zero/server'
import { describe, expect, test } from 'vitest'
import { createZeroServer } from 'on-zero/server'

import * as Queries from '~/data/generated/groupedQueries'
import { models } from '~/data/generated/models'
import { schema } from '~/data/generated/schema'
import { mutationValidators } from '~/data/generated/syncedMutations'
import { queries } from '~/data/generated/syncedQueries'

// regression for the zero 1.5 upgrade. on-zero used to pass userID:null to zero's
// query handler for logged-out users. that makes zero server-validate the
// connection against null, so a logged-out client (which connects as "anon") was
// rejected with "Connection userID does not match validated server userID" and zero
// never came online for anonymous visitors. on-zero now omits userID when there is
// no authenticated user so zero uses its client-fallback path and trusts the
// declared id; authenticated users are still pinned to their real id.
//
// this drives the real handleQueryRequest. transforming a query only builds its AST,
// so no database connection happens (the pool is created lazily and never queried).
const zeroServer = createZeroServer({
  schema,
  models,
  queries,
  mutations: mutationValidators,
  createServerActions: () => ({}),
  database: 'postgresql://unused:unused@127.0.0.1:1/unused',
})

function transformRequest(name: string, args: unknown) {
  return new Request('http://localhost/api/zero/pull', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(['transform', [{ id: 'q1', name, args: [args] }]]),
  })
}

describe('zero query handler userID validation', () => {
  test('logged-out request omits userID (zero client-fallback)', async () => {
    const { response } = await zeroServer.handleQueryRequest({
      authData: null,
      request: transformRequest('user.userById', { userId: 'someone' }),
    })

    expect((response as any).kind).toBe('QueryResponse')
    // no userID key => zero trusts the client's declared id (anon connects)
    expect('userID' in (response as any)).toBe(false)
  })

  test('authenticated request pins userID (zero server-validated)', async () => {
    const { response } = await zeroServer.handleQueryRequest({
      authData: { id: 'user-123', email: 'demo@takeout.tamagui.dev' } as any,
      request: transformRequest('user.userById', { userId: 'someone' }),
    })

    expect((response as any).kind).toBe('QueryResponse')
    expect((response as any).userID).toBe('user-123')
  })

  // soot uses the other valid anon strategy: it always hands on-zero a string id
  // (a per-session `soot_anon_id` cookie, or "anon"), so anon users are
  // server-validated against a stable id the client also declares. this is the
  // branch soot always takes and takeout never does — the fix must leave it
  // untouched. any string id (real user or stable-anon) stays server-validated.
  test('stable string anon id stays server-validated (soot pattern)', async () => {
    const { response } = await zeroServer.handleQueryRequest({
      authData: { id: 'anon' } as any,
      request: transformRequest('user.userById', { userId: 'someone' }),
    })

    expect((response as any).kind).toBe('QueryResponse')
    expect((response as any).userID).toBe('anon')
  })

  // locks the zero contract the fix depends on, and documents the old bug: zero's
  // object form coerces userID undefined/null to null and always emits it, so a
  // null userID becomes server-validated(null) — which rejects every string-id
  // (anon) connection. that is why on-zero must use the legacy positional call for
  // logged-out users instead of passing userID:null. if a future zero release omits
  // userID when null, this test breaks and on-zero can drop the branch.
  test('zero object form coerces userID:null into the response (the old bug)', async () => {
    const handler = (_name: string, args: any) => Queries.user.userById(args)
    const response: any = await zeroHandleQueryRequest({
      handler,
      schema,
      request: transformRequest('user.userById', { userId: 'someone' }),
      userID: null,
    })

    expect(response.kind).toBe('QueryResponse')
    expect('userID' in response).toBe(true)
    expect(response.userID).toBe(null)
  })
})
