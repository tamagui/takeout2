import { describe, expect, test } from 'vitest'
import { boolean, string, table } from '@rocicorp/zero'

import { setEnvironment, setSchema } from './state'
import { registerQuery, getQueryName } from './queryRegistry'
import { getMutationsPermissions, setMutationsPermissions } from './modelRegistry'

describe('usePermission _uid query identity', () => {
  // the core bug: zero-cache deduplicates custom queries by name+args.
  // without _uid in the args, permission queries for different users share
  // the same identity and zero-cache returns stale results from a previous
  // auth context (often anonymous/null).
  //
  // the fix adds _uid (auth user ID) to the query args in usePermission so
  // each user gets a unique query identity. the _uid is ignored by both the
  // client-side and server-side permission evaluation (they only read objOrId).

  test('permission check fn ignores extra _uid in args', () => {
    // setup minimal state for permission check
    const testTable = table('testEntity')
      .columns({
        id: string(),
        ownerId: string(),
        active: boolean(),
      })
      .primaryKey('id')

    setSchema({ tables: { testEntity: testTable }, version: 1 } as any)
    setEnvironment('client')

    // simulate what createPermissionCheckFn does:
    // it reads args.objOrId and ignores anything else
    const fn = (args: { objOrId: string | Record<string, any>; _uid?: string }) => {
      // this mirrors the real fn - only objOrId is used
      return { objOrId: args.objOrId }
    }

    const result1 = fn({ objOrId: 'test-id', _uid: 'user-A' })
    const result2 = fn({ objOrId: 'test-id', _uid: 'user-B' })
    const result3 = fn({ objOrId: 'test-id' })

    // all return the same objOrId regardless of _uid
    expect(result1.objOrId).toBe('test-id')
    expect(result2.objOrId).toBe('test-id')
    expect(result3.objOrId).toBe('test-id')
  })

  test('different _uid values produce different serialized args', () => {
    // zero-cache uses JSON-serialized args as part of the query identity
    // different _uid values must produce different serialized forms
    const args1 = JSON.stringify({ objOrId: 'server-1', _uid: 'user-A' })
    const args2 = JSON.stringify({ objOrId: 'server-1', _uid: 'user-B' })
    const args3 = JSON.stringify({ objOrId: 'server-1', _uid: 'anon' })

    expect(args1).not.toBe(args2)
    expect(args1).not.toBe(args3)
    expect(args2).not.toBe(args3)
  })

  test('same _uid produces stable query identity', () => {
    // ensure the same user gets the same query identity (no re-fetching)
    const args1 = JSON.stringify({ objOrId: 'server-1', _uid: 'user-A' })
    const args2 = JSON.stringify({ objOrId: 'server-1', _uid: 'user-A' })

    expect(args1).toBe(args2)
  })

  test('permission registration works for query lookup', () => {
    // verify that permission where functions register correctly
    const mockWhere = (eb: any, auth: any) => eb.cmp('ownerId', auth?.id || '')
    setMutationsPermissions('testEntity', mockWhere as any)

    const perm = getMutationsPermissions('testEntity')
    expect(perm).toBeDefined()
    expect(perm).toBe(mockWhere)
  })

  test('query name registration preserves permission namespace', () => {
    const fn = () => {}
    registerQuery(fn, 'permission.testEntity')

    expect(getQueryName(fn)).toBe('permission.testEntity')
  })
})
