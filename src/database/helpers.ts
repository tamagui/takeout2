import { createServerHelpers } from '@tamatko/postgres'
import { database } from './database'

export const { sql, getDBClient } = createServerHelpers(database)
