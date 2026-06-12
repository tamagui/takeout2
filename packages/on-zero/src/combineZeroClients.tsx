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
  usePermission: (...args: any[]) => any
  zero: any
  preload: (...args: any[]) => any
  getQuery: (...args: any[]) => any
  zeroEvents: Emitter<ZeroEvent | null>
  ControlQueries: (props: ControlQueriesProps) => ReactNode
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
>(...clients: Clients): CombinedZeroClients<Clients> {
  const primary = clients[0]
  const clientsByName = new Map(clients.map((client) => [client.instanceName, client]))

  const ownerOfNamespace = (namespace: string): CombinableZeroClient => {
    const owner = getInstanceForNamespace(namespace)
    return (owner && clientsByName.get(owner.name)) || primary
  }

  const ownerOfQueryFn = (fn: Function): CombinableZeroClient => {
    const owner = getInstanceForQueryFn(fn)
    return (owner && clientsByName.get(owner.name)) || primary
  }

  // hooks: a given call site always passes the same query fn / table, so the
  // dispatched hook target is stable across renders (no conditional hooks)
  function useQuery(...args: any[]) {
    return ownerOfQueryFn(args[0]).useQuery(...args)
  }

  function usePermission(...args: any[]) {
    // model namespaces are table-named, so the table arg picks the owner
    return ownerOfNamespace(String(args[0])).usePermission(...args)
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
