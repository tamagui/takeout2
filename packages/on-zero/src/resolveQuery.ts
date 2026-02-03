import { getQueryName } from './queryRegistry'

import type { AnyQueryRegistry, Query, Schema as ZeroSchema } from '@rocicorp/zero'

export type PlainQueryFn<
  TArg = any,
  TReturn extends Query<any, any, any> = Query<any, any, any>,
> = (args: TArg) => TReturn

/**
 * resolves a plain query function to a QueryRequest using the customQueries registry
 */
export function resolveQuery<Schema extends ZeroSchema>({
  customQueries,
  fn,
  params,
}: {
  customQueries: AnyQueryRegistry
  fn: PlainQueryFn<any, Query<any, Schema, any>>
  params?: any
}) {
  const queryName = getQueryName(fn)
  if (!queryName) {
    const fnName = fn?.name || 'anonymous'
    throw new Error(
      `Query function '${fnName}' not registered. ` +
        `Ensure it is exported from a queries file and passed to createZeroClient via groupedQueries.`
    )
  }

  // look up the CustomQuery from the shared registry
  // queryName is "namespace.name" format, e.g., "user.userById"
  const [namespace, name] = queryName.split('.', 2)
  const customQuery = (customQueries as any)[namespace]?.[name]

  if (!customQuery) {
    throw new Error(
      `CustomQuery '${queryName}' not found. ` +
        `Check that the query is exported and the namespace/name matches.`
    )
  }

  return params !== undefined ? customQuery(params) : customQuery()
}
