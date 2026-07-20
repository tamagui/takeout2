import {
  createZeroServerBindings,
  type NormalizedClaims,
  type ZeroServerExecutor,
} from 'on-zero/server'

import type { Schema as ZeroSchema } from '@rocicorp/zero'
import type { Config, MutatorContext } from 'on-zero'

type AppAuthData = {
  email: string
  id: string
  role: 'admin' | undefined
}

declare module 'on-zero' {
  interface Config {
    authData: AppAuthData
  }
}

type Models = {
  project: {
    mutate: {
      create: (context: MutatorContext, input: { id: string }) => Promise<void>
    }
  }
}

type Actions = Record<string, never>

const bindings = createZeroServerBindings<ZeroSchema, Models, Actions>({
  schema: {} as ZeroSchema,
  models: {} as Models,
  createServerActions: () => ({}),
})

declare const executor: ZeroServerExecutor<ZeroSchema>
const server = bindings.server(executor)

const authData: Config['authData'] = {
  email: 'admin@example.com',
  id: 'admin',
  role: 'admin',
}
const claims: NormalizedClaims = {
  email: authData.email,
  role: authData.role ?? null,
  userID: authData.id,
}

void bindings.resolveQuery('project|byID', [{ id: 'project' }], claims)
void server.mutate.project.create({ id: 'project' }, { authData })
void server.transaction(claims, async (tx) => tx.location)
void server.query(claims, () => null as never)

// @ts-expect-error mutation argument types remain enforced through the server facade
void server.mutate.project.create({ id: 42 }, { authData })
