// registry mapping query/mutator namespaces to the zero client instance that
// owns them. enables multiple createZeroClient instances on one page (e.g. a
// control-plane instance + a per-project instance): the ambient run() and the
// combineZeroClients facade dispatch each query/mutation to the owning
// instance by its registered namespace instead of whichever mounted last.
//
// stored via globalValue so dual-loaded module copies (cjs/esm) share one map,
// matching the package's other cross-module registries.

import { globalValue } from '@take-out/helpers'

import { getQueryName } from './queryRegistry'

import type { ZeroRunner } from './zeroRunner'
import type { AnyQueryRegistry } from '@rocicorp/zero'

export type ZeroClientInstance = {
  name: string
  customQueries: AnyQueryRegistry
  // set when the instance's provider mounts (client); stays null on the
  // server, where the ambient transaction runner serves every instance
  runner: ZeroRunner | null
}

const getInstancesByNamespace = () =>
  globalValue<Map<string, ZeroClientInstance>>(
    'on-zero:instances-by-namespace',
    () => new Map(),
  )

export function registerClientInstance({
  name,
  namespaces,
  customQueries,
}: {
  name: string
  namespaces: string[]
  customQueries: AnyQueryRegistry
}): ZeroClientInstance {
  const instancesByNamespace = getInstancesByNamespace()

  // re-creating an instance under the same name (hmr) replaces its claims
  for (const [namespace, owner] of instancesByNamespace) {
    if (owner.name === name) {
      instancesByNamespace.delete(namespace)
    }
  }

  const instance: ZeroClientInstance = { name, customQueries, runner: null }

  for (const namespace of namespaces) {
    const existing = instancesByNamespace.get(namespace)
    if (existing) {
      throw new Error(
        `[on-zero] namespace '${namespace}' is already claimed by zero client instance '${existing.name}' ` +
          `(while creating instance '${name}'). Each query/mutator namespace must belong to exactly one createZeroClient instance.`,
      )
    }
    instancesByNamespace.set(namespace, instance)
  }

  return instance
}

export function getInstanceForNamespace(
  namespace: string,
): ZeroClientInstance | undefined {
  return getInstancesByNamespace().get(namespace)
}

export function getInstanceForQueryFn(fn: Function): ZeroClientInstance | undefined {
  const queryName = getQueryName(fn)
  if (!queryName) return undefined
  return getInstanceForNamespace(queryName.split('.', 1)[0])
}
