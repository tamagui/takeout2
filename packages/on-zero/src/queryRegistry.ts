// registry for query functions to their stable names
// this allows minification while preserving query identity
//
// stamps the query name directly on the function object instead of using
// a WeakMap. this survives CJS module boundary issues where function
// reference identity can be lost (e.g. native iframe CJS bundles executed
// via new Function() where the require() cache differs from the registration
// context).

const QUERY_NAME_KEY = '__onZeroQueryName'
const queryNamesByFunctionName = new Map<string, string | null>()

export function registerQuery(fn: Function, name: string) {
  ;(fn as any)[QUERY_NAME_KEY] = name

  if (!fn.name) return

  const existing = queryNamesByFunctionName.get(fn.name)
  if (existing === undefined || existing === name) {
    queryNamesByFunctionName.set(fn.name, name)
  } else {
    queryNamesByFunctionName.set(fn.name, null)
  }
}

export function getQueryName(fn: Function): string | undefined {
  const stampedName = (fn as any)?.[QUERY_NAME_KEY]
  if (stampedName) return stampedName

  const namedQuery = queryNamesByFunctionName.get(fn?.name)
  return namedQuery ?? undefined
}
