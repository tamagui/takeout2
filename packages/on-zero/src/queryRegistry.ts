// registry for query functions to their stable names
// this allows minification while preserving query identity

import { globalValue } from '@take-out/helpers'

const queryNameRegistry = globalValue(
  `on-zero:query-name`,
  () => new WeakMap<Function, string>()
)

export function registerQuery(fn: Function, name: string) {
  queryNameRegistry.set(fn, name)
}

export function getQueryName(fn: Function): string | undefined {
  return queryNameRegistry.get(fn)
}
