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

// fail loud when a generated namespace drifts out of a multi-instance partition.
// multi-instance consumers (control + project, control + server, …) hand-split
// the generated query/model namespaces across instances; a namespace that ends
// up in NEITHER partition silently un-registers its queries (its useQuery throws
// "query not registered" at runtime, error-boundarying a whole screen — the soot
// `planGrant` regression). run this at module-eval over each partitioned group so
// the drift is a build/boot throw instead. also catches a namespace listed in
// MORE than one partition (an ambiguous owner), which the hand-rolled loops did
// not. `partitions` maps a label (e.g. 'control'/'project') to that instance's
// namespace table; every key in `entries` must appear in exactly one.
export function assertZeroInstancePartition(
  kind: string,
  entries: Record<string, unknown>,
  partitions: Record<string, Record<string, unknown>>,
): void {
  const labels = Object.keys(partitions)
  for (const name of Object.keys(entries)) {
    const owners = labels.filter((label) => name in partitions[label])
    if (owners.length === 0) {
      throw new Error(
        `[on-zero] generated ${kind} "${name}" is missing from the instance partition ` +
          `(${labels.join(' / ')}) — add it to exactly one partition table.`,
      )
    }
    if (owners.length > 1) {
      throw new Error(
        `[on-zero] generated ${kind} "${name}" is claimed by more than one instance partition ` +
          `(${owners.join(', ')}) — it must belong to exactly one.`,
      )
    }
  }
}
