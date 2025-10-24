// this will go away once we finalize the new zero synced queries setup

import { context, createPermissions } from 'over-zero'
import { schema } from '~/data/schema'
import { models } from '../data/models'

export { schema } from '~/data/schema'

export const permissions = createPermissions({
  environment: 'server',
  schema,
  models,
  getContext: context,
}).readPermissions
