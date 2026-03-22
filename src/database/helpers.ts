import { createServerHelpers } from '@take-out/postgres/createServerHelpers'

import { database } from './database'

export const { sql, getDBClient } = createServerHelpers(database)
