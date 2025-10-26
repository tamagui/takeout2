import type { AuthData } from '~/auth/types'
import type { schema } from '~/data/schema'
import type { ServerActions } from '~/data/server/createServerActions'

type Schema = typeof schema

declare module 'over-zero' {
  interface Config {
    schema: Schema
    authData: AuthData
    serverActions: ServerActions
  }
}
