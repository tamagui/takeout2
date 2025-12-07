import type { schema } from '~/data/schema'
import type { ServerActions } from '~/data/server/createServerActions'
import type { AuthData } from '~/features/auth/types'

type Schema = typeof schema

declare module 'over-zero' {
  interface Config {
    schema: Schema
    authData: AuthData
    serverActions: ServerActions
  }
}
