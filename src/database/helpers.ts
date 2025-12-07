import { createServerHelpers } from '@take-out/postgres'

import { database } from './database'

export const { sql, getDBClient } = createServerHelpers(database)
