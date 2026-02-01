import { assertString } from '@take-out/helpers'
import { createZeroServer } from 'on-zero/server'

import { models } from '~/data/generated/models'
import { queries } from '~/data/generated/syncedQueries'
import { schema } from '~/data/schema'
import { createServerActions } from '~/data/server/createServerActions'
import { ZERO_UPSTREAM_DB } from '~/server/env-server'

export const zeroServer = createZeroServer({
  schema,
  models,
  createServerActions,
  queries,
  // use imported value (bracket notation) to prevent build-time inlining
  database: assertString(ZERO_UPSTREAM_DB, `no ZERO_UPSTREAM_DB`),
})
