import { createServerHelpers } from '@vxrn/postgres'
import { database } from './database'

export const { sql, getDBClient } = createServerHelpers(database)
