import { assertString } from '@vxrn/helpers'
import { createZeroServer } from 'over-zero/server'
import { models } from '~/data/models'
import { schema } from '~/data/schema'
import { createServerActions } from '~/data/server/createServerActions'

export const zeroServer = createZeroServer({
  schema,
  models,
  createServerActions,
  database: assertString(process.env.ZERO_UPSTREAM_DB, `no ZERO_UPSTREAM_DB`),
})
