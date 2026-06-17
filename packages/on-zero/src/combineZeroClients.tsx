import { createEmitter, type Emitter } from '@take-out/helpers'

import { getInstanceForNamespace, getInstanceForQueryFn } from './instanceRegistry'
import { run } from './run'

import type { ZeroEvent } from './types'
import type { ReactNode } from 'react'

// combines multiple createZeroClient instances into one consumer surface:
// useQuery/run/preload/getQuery dispatch to the instance that claimed the
// query fn's namespace, zero.mutate.<namespace> dispatches by model
// namespace, and everything unclaimed (plus non-mutate zero access like
// userID/clientID) goes to the FIRST client — the primary. consumers render
// each client's ProvideZero themselves; this facade does not use react
// context, matching the existing global-zero-import style.
//
// PROVIDER NESTING CONTRACT: zero-react's useQuery resolves its instance from
// the NEAREST ZeroProvider context, so only ONE instance — the one whose
// provider is mounted INNERMOST — may use the upstream context path. by
// default that is the LAST client passed here (override via the `inner`
// option); the first client is primary and its provider is expected OUTER.
// the inner instance's queries ride zero-react's useQuery unchanged. every
// other instance must be created through `createZeroClientWithDirectQueries`
// from `on-zero/multi`, which opts into the context-free adapter for this
// nested-provider edge case. keep those non-inner instances bounded.

type ControlQueriesProps = {
  children: ReactNode
  action?: 'enable' | 'disable'
  whenDisabled?: 'empty' | 'last-value'
}

// the minimal structural surface the facade dispatches over — the const
// generic captures each client's real types, this only constrains shape
type CombinableZeroClient = {
  instanceName: string
  useQuery: (...args: any[]) => any
  useQueryDirect: (...args: any[]) => any
  usePermission: (...args: any[]) => any
  usePermissionDirect: (...args: any[]) => any
  zero: any
  preload: (...args: any[]) => any
  getQuery: (...args: any[]) => any
  zeroEvents: Emitter<ZeroEvent | null>
  ControlQueries: (props: ControlQueriesProps) => ReactNode
}

export type CombineZeroClientsOptions = {
  // instanceName of the client whose ProvideZero is mounted INNERMOST.
  // defaults to the last client passed.
  inner?: string
}

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never

export type CombinedZeroClients<Clients extends readonly CombinableZeroClient[]> = {
  useQuery: UnionToIntersection<Clients[number]['useQuery']>
  usePermission: UnionToIntersection<Clients[number]['usePermission']>
  zero: UnionToIntersection<Clients[number]['zero']>
  preload: UnionToIntersection<Clients[number]['preload']>
  getQuery: UnionToIntersection<Clients[number]['getQuery']>
  run: typeof run
  zeroEvents: Emitter<ZeroEvent | null>
  ControlQueries: (props: ControlQueriesProps) => ReactNode
}

export function combineZeroClients<
  const Clients extends readonly [CombinableZeroClient, ...CombinableZeroClient[]],
>(
  ...clientsAndOptions: [...Clients] | [...Clients, CombineZeroClientsOptions]
): CombinedZeroClients<Clients> {
  const last = clientsAndOptions[clientsAndOptions.length - 1]
  const hasOptions = typeof (last as { instanceName?: unknown }).instanceName !== 'string'
  // boundary narrow: everything before a trailing options object is a client
  const clients = (hasOptions
    ? clientsAndOptions.slice(0, -1)
    : clientsAndOptions) as unknown as Clients
  const options: CombineZeroClientsOptions = hasOptions
    ? (last as CombineZeroClientsOptions)
    : {}

  const primary = clients[0]
  const innerName = options.inner ?? clients[clients.length - 1]!.instanceName
  const clientsByName = new Map(clients.map((client) => [client.instanceName, client]))

  if (!clientsByName.has(innerName)) {
    throw new Error(
      `[on-zero] combineZeroClients inner instance '${innerName}' is not one of the passed clients`,
    )
  }

  const ownerOfNamespace = (namespace: string): CombinableZeroClient => {
    const owner = getInstanceForNamespace(namespace)
    return (owner && clientsByName.get(owner.name)) || primary
  }

  const ownerOfQueryFn = (fn: Function): CombinableZeroClient => {
    const owner = getInstanceForQueryFn(fn)
    return (owner && clientsByName.get(owner.name)) || primary
  }

  // hooks: a given call site always passes the same query fn / table, so the
  // dispatched hook target is stable across renders (no conditional hooks).
  // only the inner instance may use the upstream context path — its provider
  // is the nearest one, so useZero() resolves to it. everyone else goes
  // through the context-free direct hooks.
  function useQuery(...args: any[]) {
    const owner = ownerOfQueryFn(args[0])
    return owner.instanceName === innerName
      ? owner.useQuery(...args)
      : owner.useQueryDirect(...args)
  }

  function usePermission(...args: any[]) {
    // model namespaces are table-named, so the table arg picks the owner;
    // permission checks follow the same context vs direct path as the
    // table's other queries
    const owner = ownerOfNamespace(String(args[0]))
    return owner.instanceName === innerName
      ? owner.usePermission(...args)
      : owner.usePermissionDirect(...args)
  }

  const mutate = new Proxy({} as never, {
    get(_, key) {
      if (typeof key !== 'string') return undefined
      return ownerOfNamespace(key).zero.mutate[key]
    },
  })

  const zero = new Proxy({} as never, {
    get(_, key) {
      if (key === 'mutate') {
        return mutate
      }
      // non-mutate access (userID, clientID, close, …) forwards to primary
      return primary.zero[key]
    },
  })

  function preload(...args: any[]) {
    return ownerOfQueryFn(args[0]).preload(...args)
  }

  function getQuery(...args: any[]) {
    return ownerOfQueryFn(args[0]).getQuery(...args)
  }

  // one events stream relaying every instance's emitter
  const zeroEvents = createEmitter<ZeroEvent | null>(
    `zero:combined(${clients.map((client) => client.instanceName).join('+')})`,
    null,
  )
  for (const client of clients) {
    client.zeroEvents.listen((event) => zeroEvents.emit(event))
  }

  const ControlQueries = ({ children, ...props }: ControlQueriesProps) =>
    clients.reduceRight(
      (inner: ReactNode, client) => (
        <client.ControlQueries {...props}>{inner}</client.ControlQueries>
      ),
      children,
    )

  const combined = {
    useQuery,
    usePermission,
    zero,
    preload,
    getQuery,
    run,
    zeroEvents,
    ControlQueries,
  }

  // boundary assertion: the dispatching wrappers are untyped internally; the
  // combined type re-applies each client's real surface
  return combined as unknown as CombinedZeroClients<Clients>
}
