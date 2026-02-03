// registry for query functions to their stable names
// this allows minification while preserving query identity

const queryNameRegistry = new WeakMap<Function, string>()

export function registerQuery(fn: Function, name: string) {
  queryNameRegistry.set(fn, name)
}

export function getQueryName(fn: Function): string | undefined {
  return queryNameRegistry.get(fn)
}
