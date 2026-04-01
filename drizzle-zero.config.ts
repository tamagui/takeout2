import { drizzleZeroConfig } from 'drizzle-zero'
import * as schema from './src/database/schema'
import { relations } from './src/database/relations'

export default drizzleZeroConfig(
  { ...schema, relations },
  {
    tables: {
      userPublic: true,
      userState: true,
      post: true,
      comment: true,
      block: true,
      report: true,
      device: true,
      notification: true,
      invite: true,
    },
    suppressDefaultsWarning: true,
  },
)
