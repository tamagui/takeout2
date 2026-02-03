import { getZQL } from './state'

import type { QueryBuilder } from './types'

export const zql = new Proxy({} as QueryBuilder, {
  get(_target, prop) {
    const b = getZQL()
    return (b as any)[prop]
  },
})
