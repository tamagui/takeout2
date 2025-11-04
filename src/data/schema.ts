import { createSchema } from '@rocicorp/zero'
import { allRelationships } from './relationships'
import * as tables from './generated/tables'

const allTables = Object.values(tables)

export const schema = createSchema({
  tables: allTables,
  relationships: allRelationships,
  enableLegacyQueries: false,
})
