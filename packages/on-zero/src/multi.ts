import {
  createZeroClientInternal,
  type DirectQueryAdapter,
  type CreateZeroClientOptions,
} from './createZeroClient'
import { createUseQueryDirect } from './createUseQueryDirect'

import type { GenericModels } from './types'
import type { Schema as ZeroSchema } from '@rocicorp/zero'

export * from './combineZeroClients'

export function createZeroClientWithDirectQueries<
  Schema extends ZeroSchema,
  Models extends GenericModels,
>(
  options: CreateZeroClientOptions<Schema, Models>,
): ReturnType<typeof createZeroClientInternal<Schema, Models>> {
  const createDirectUseQuery: DirectQueryAdapter<Schema> = createUseQueryDirect
  return createZeroClientInternal<Schema, Models>({
    ...options,
    createDirectUseQuery,
  })
}
