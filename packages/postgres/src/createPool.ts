import pg, { type Pool } from 'pg'

export const createPool = (connectionString: string): Pool => {
  return new pg.Pool({
    connectionString,
  })
}
