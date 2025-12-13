import { assertString } from '@take-out/helpers'
import { createZeroServer } from 'over-zero/server'

import { models } from '~/data/generated/models'
import { queries } from '~/data/generated/syncedQueries'
import { schema } from '~/data/schema'
import { createServerActions } from '~/data/server/createServerActions'

export const zeroServer = createZeroServer({
  schema,
  models,
  createServerActions,
  queries,
  database: assertString(process.env.ZERO_UPSTREAM_DB, `no ZERO_UPSTREAM_DB`),
})
