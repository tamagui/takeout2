import { assertString } from '@take-out/helpers'
import { createZeroServer } from 'on-zero/server'

import { models } from '~/data/generated/models'
import { mutationValidators } from '~/data/generated/syncedMutations'
import { queries } from '~/data/generated/syncedQueries'
import { schema } from '~/data/schema'
import { createServerActions } from '~/data/server/createServerActions'
import { ZERO_UPSTREAM_DB } from '~/server/env-server'

export const zeroServer = createZeroServer({
  schema,
  models,
  createServerActions,
  queries,
  mutations: mutationValidators,
  // use imported value (bracket notation) to prevent build-time inlining
  database: assertString(ZERO_UPSTREAM_DB, `no ZERO_UPSTREAM_DB`),
  // if you want admin default mutations:
  // defaultMutateAuthData: { id: '', email: 'admin@start.chat', role: 'admin' },
})
