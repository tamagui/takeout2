import { assertString } from '@take-out/helpers'
import { createZeroServer } from 'on-zero/server'

import { models } from '~/data/generated/models'
import { mutationValidators } from '~/data/generated/syncedMutations'
import { queries } from '~/data/generated/syncedQueries'
import { schema } from '~/data/generated/schema'
import { createServerActions } from '~/data/server/createServerActions'
import { server } from '~/env'

export const zeroServer = createZeroServer({
  schema,
  models,
  createServerActions,
  queries,
  mutations: mutationValidators,
  database: assertString(server.ZERO_UPSTREAM_DB, `ZERO_UPSTREAM_DB not set`),
  defaultAllowAdminRole: 'all',
})
