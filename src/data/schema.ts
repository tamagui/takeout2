import { createSchema } from '@rocicorp/zero'

import * as tables from './generated/tables'
import { allRelationships } from './relationships'

const allTables = Object.values(tables)

export const schema = createSchema({
  tables: allTables,
  relationships: allRelationships,
  enableLegacyQueries: false,
})
