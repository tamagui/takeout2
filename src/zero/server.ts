import { createOrezBindings } from 'on-zero/orez'
import {
  createPostgreSQLApplicationDatabase,
  createSyncExecutor,
  type JsonValue,
  type NormalizedClaims,
} from 'orez/sync-executor'

import { db } from '~/database/db'
import { models } from '~/data/generated/models'
import { mutationValidators } from '~/data/generated/syncedMutations'
import { queries } from '~/data/generated/syncedQueries'
import { schema } from '~/data/generated/schema'
import { createServerActions } from '~/data/server/createServerActions'
import { server } from '~/env'

import type { AuthData } from 'on-zero'

export const zeroBindings = createOrezBindings({
  schema,
  models,
  createServerActions,
  queries,
  mutations: mutationValidators,
  defaultAllowAdminRole: 'all',
})

export const zeroExecutor = createSyncExecutor({
  schema,
  mutators: zeroBindings.mutators,
  database: createPostgreSQLApplicationDatabase(db.pool, {
    internalSchema: `${server.ZERO_APP_ID}_0`,
    schema,
  }),
  effects: {
    runBackground(promise) {
      void promise
    },
    report(error) {
      console.error('[zero] background task failed', error)
    },
  },
})

export const zeroServer = zeroBindings.server(zeroExecutor)

export function normalizeZeroClaims(authData: AuthData | null): NormalizedClaims {
  const claims: Record<string, JsonValue> = {
    userID: typeof authData?.id === 'string' ? authData.id : 'anon',
  }
  if (typeof authData?.email === 'string') claims.email = authData.email
  if (typeof authData?.role === 'string') claims.role = authData.role
  return claims as NormalizedClaims
}
