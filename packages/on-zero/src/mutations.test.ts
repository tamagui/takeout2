import { describe, expect, test } from 'vitest'

import { mutations } from './mutations'
import { serverWhere } from './serverWhere'

describe('mutations registry', () => {
  test('two modules registering the same table keep both custom mutators', () => {
    // a template commonly splits a table's mutators across files (the table's
    // own mutations file plus a seed.ts firing a demo seed on that table).
    // the registry is keyed by table, so a wholesale replace made whichever
    // module imported LAST win: alphabetical import order silently dropped
    // seed.ts's seedDemo whenever the seed file sorted before the table file.
    const permissions = serverWhere('todo', () => true)

    const seedModule = mutations('todo', permissions, {
      seedDemo: async () => {},
    })
    const tableModule = mutations('todo', permissions, {})

    expect(typeof seedModule.seedDemo).toBe('function')
    expect(typeof tableModule.insert).toBe('function')
    // both proxies read the same per-table registry: the later CRUD-only
    // registration must not clobber the earlier custom mutator
    expect(typeof (tableModule as Record<string, unknown>).seedDemo).toBe('function')
    expect(Object.keys(tableModule)).toContain('seedDemo')
  })

  test('re-registering a handler replaces it per key (HMR)', () => {
    const permissions = serverWhere('post', () => true)
    const v1 = async () => {}
    const v2 = async () => {}
    mutations('post', permissions, { custom: v1 })
    const proxy = mutations('post', permissions, { custom: v2 })
    // per-key merge must still take the newest registration for an edited
    // handler, otherwise HMR would pin the stale implementation
    expect(proxy.custom).toBe(v2)
  })
})
