import { createSchema, string, table } from '@rocicorp/zero'
import { createEmitter } from '@take-out/helpers'
import { describe, expect, test, vi } from 'vitest'

import { combineZeroClients } from './combineZeroClients'
import { createZeroClient } from './createZeroClient'
import { runWithContext } from './helpers/mutatorContext'
import { getInstanceForNamespace, registerClientInstance } from './instanceRegistry'
import { registerQuery } from './queryRegistry'
import { run } from './run'
import { setRunner, type ZeroRunner } from './zeroRunner'
import { zql } from './zql'

import type { ZeroEvent } from './types'
import type { AnyQueryRegistry, Query } from '@rocicorp/zero'
import type { ReactNode } from 'react'

const userTable = table('user').columns({ id: string(), name: string() }).primaryKey('id')
const taskTable = table('task')
  .columns({ id: string(), title: string() })
  .primaryKey('id')
const schema = createSchema({ tables: [userTable, taskTable] })

// query fns are never invoked in these tests (runners are mocked, and
// defineQueries resolves to lazy QueryRequests), so the body is a stub
const makeQueryFn = () => (args: { id: string }) =>
  args as unknown as Query<'user', typeof schema>

// each test uses unique instance names + namespaces — the instance registry
// is module-global and shared across tests in this file
function makeClient(instanceName: string, namespace: string) {
  const byId = makeQueryFn()
  return {
    byId,
    client: createZeroClient({
      schema,
      models: {},
      groupedQueries: { [namespace]: { byId } },
      instanceName,
    }),
  }
}

// a structural stand-in for a createZeroClient return value, registered in
// the instance registry so the facade can resolve namespace ownership.
// real clients can't be used for mutate/useQuery dispatch tests because
// their zero proxy requires a mounted ZeroProvider.
function fakeClient(name: string, namespaces: string[], zeroStub: unknown) {
  registerClientInstance({
    name,
    namespaces,
    // boundary stub: dispatch tests never resolve queries through it
    customQueries: {} as AnyQueryRegistry,
  })
  return {
    instanceName: name,
    useQuery: vi.fn(() => `${name}-useQuery`),
    useQueryDirect: vi.fn(() => `${name}-useQueryDirect`),
    usePermission: vi.fn(() => `${name}-usePermission`),
    usePermissionDirect: vi.fn(() => `${name}-usePermissionDirect`),
    zero: zeroStub,
    preload: vi.fn(() => `${name}-preload`),
    getQuery: vi.fn(() => `${name}-getQuery`),
    zeroEvents: createEmitter<ZeroEvent | null>(`zero:test-${name}`, null),
    ControlQueries: ({ children }: { children: ReactNode }) => children,
  }
}

describe('multi-instance namespace dispatch', () => {
  test('run() dispatches named queries to the owning instance runner', async () => {
    const control = makeClient('run-control', 'runUser')
    const project = makeClient('run-project', 'runTask')

    // simulate each instance's provider mount (SetZeroInstance)
    const controlRunner = vi.fn(async (..._args: unknown[]) => ({ from: 'control' }))
    const projectRunner = vi.fn(async (..._args: unknown[]) => ({ from: 'project' }))
    getInstanceForNamespace('runUser')!.runner = controlRunner as ZeroRunner
    getInstanceForNamespace('runTask')!.runner = projectRunner as ZeroRunner

    // the last mount also claims the ambient runner — owned namespaces must
    // not use it (this is the "second mount steals run()" bug)
    const ambientRunner = vi.fn(async (..._args: unknown[]) => ({ from: 'ambient' }))
    setRunner(ambientRunner as ZeroRunner)

    await expect(run(control.byId, { id: '1' })).resolves.toEqual({ from: 'control' })
    await expect(run(project.byId, { id: '2' })).resolves.toEqual({ from: 'project' })
    expect(ambientRunner).not.toHaveBeenCalled()

    // the request resolved through the owning instance's own query registry
    const request = controlRunner.mock.calls[0]![0] as { query: { queryName: string } }
    expect(request.query.queryName).toBe('runUser.byId')
  })

  test('run() rejects named queries inside server mutation context', async () => {
    const { byId } = makeClient('run-ctx-owner', 'runCtxThing')
    const ownerRunner = vi.fn(async (..._args: unknown[]) => ({ from: 'owner' }))
    getInstanceForNamespace('runCtxThing')!.runner = ownerRunner as ZeroRunner
    const txRun = vi.fn(async (..._args: unknown[]) => ({ from: 'tx' }))

    await expect(
      runWithContext(
        {
          authData: null,
          environment: 'server',
          can: async () => {},
          tx: { run: txRun },
        } as any,
        () => run(byId, { id: '1' }),
      ),
    ).rejects.toThrow(/run\(namedQuery\) cannot be used inside a Zero mutation/)

    expect(ownerRunner).not.toHaveBeenCalled()
    expect(txRun).not.toHaveBeenCalled()
  })

  test('run() keeps named queries on their owning client runner when browser context leaks', async () => {
    const { byId } = makeClient('run-client-leak-owner', 'runClientLeakThing')
    const ownerRunner = vi.fn(async (..._args: unknown[]) => ({ from: 'owner' }))
    getInstanceForNamespace('runClientLeakThing')!.runner = ownerRunner as ZeroRunner
    const txRun = vi.fn(async (..._args: unknown[]) => ({ from: 'tx' }))

    await expect(
      runWithContext(
        {
          authData: null,
          environment: 'client',
          can: async () => {},
          tx: { run: txRun },
        } as any,
        () => run(byId, { id: '1' }),
      ),
    ).resolves.toEqual({ from: 'owner' })

    expect(ownerRunner).toHaveBeenCalledTimes(1)
    expect(txRun).not.toHaveBeenCalled()
  })

  test('run() keeps inline zql on the active transaction runner', async () => {
    makeClient('run-inline-context', 'runInlineThing')
    const ambientRunner = vi.fn(async (..._args: unknown[]) => ({ from: 'ambient' }))
    setRunner(ambientRunner as ZeroRunner)
    const txRun = vi.fn(async (..._args: unknown[]) => ({ from: 'tx' }))
    const query = zql.user.where('id', '1')

    await expect(
      runWithContext(
        {
          authData: null,
          environment: 'client',
          can: async () => {},
          tx: { run: txRun },
        } as any,
        () => run(query),
      ),
    ).resolves.toEqual({ from: 'tx' })

    expect(txRun).toHaveBeenCalledWith(query, undefined)
    expect(ambientRunner).not.toHaveBeenCalled()
  })

  test('a claimed namespace with an unmounted instance uses the ambient runner (server path)', async () => {
    const { byId } = makeClient('srv-instance', 'srvThing')
    const ambient = vi.fn(async (..._args: unknown[]) => ({ from: 'ambient' }))
    setRunner(ambient as ZeroRunner)

    await expect(run(byId, { id: '1' })).resolves.toEqual({ from: 'ambient' })
    expect(ambient).toHaveBeenCalledTimes(1)
  })

  test('duplicate namespace claim throws at create time', () => {
    makeClient('dup-a', 'dupNs')
    expect(() => makeClient('dup-b', 'dupNs')).toThrow(/already claimed/)
  })

  test('re-creating an instance under the same name re-claims without throwing (hmr)', () => {
    makeClient('hmr', 'hmrNs')
    expect(() => makeClient('hmr', 'hmrNs')).not.toThrow()
    expect(getInstanceForNamespace('hmrNs')?.name).toBe('hmr')
  })

  test('model namespaces are claimed too', () => {
    const models = { mdlThing: { mutate: { insert: async () => {} } } }
    createZeroClient({
      schema,
      models,
      groupedQueries: {},
      instanceName: 'mdl-a',
    })
    expect(getInstanceForNamespace('mdlThing')?.name).toBe('mdl-a')
    expect(() =>
      createZeroClient({
        schema,
        models,
        groupedQueries: {},
        instanceName: 'mdl-b',
      }),
    ).toThrow(/already claimed/)
  })
})

describe('multi-instance isolation', () => {
  test('each instance has an isolated zeroEvents emitter', () => {
    const { client: a } = makeClient('emit-a', 'emitA')
    const { client: b } = makeClient('emit-b', 'emitB')

    expect(a.zeroEvents).not.toBe(b.zeroEvents)
    expect(a.zeroEvents.options?.name).toBe('zero:emit-a')
    expect(b.zeroEvents.options?.name).toBe('zero:emit-b')

    const seenByB: Array<ZeroEvent | null> = []
    b.zeroEvents.listen((event) => seenByB.push(event))
    a.zeroEvents.emit({ type: 'error', message: 'a-only' })

    expect(seenByB).toEqual([])
    expect(a.zeroEvents.value).toEqual({ type: 'error', message: 'a-only' })
    expect(b.zeroEvents.value).toBe(null)
  })

  test('the default instance keeps the legacy emitter name', () => {
    const { client } = makeClient('default', 'defaultNs')
    expect(client.zeroEvents.options?.name).toBe('zero')
  })

  test('each instance has its own unmounted zero proxy', () => {
    const { client: a } = makeClient('proxy-a', 'proxyA')
    const { client: b } = makeClient('proxy-b', 'proxyB')
    // identity check without handing the proxy to expect() — vitest's
    // thenable detection would access .then and trip the unmounted throw
    expect(a.zero === (b.zero as unknown)).toBe(false)
    // neither provider is mounted; each proxy throws its own error rather
    // than resolving against some shared/global instance
    expect(() => a.zero.clientID).toThrow(/not initialized/)
    expect(() => b.zero.clientID).toThrow(/not initialized/)
  })
})

describe('combineZeroClients facade', () => {
  test('zero.mutate dispatches by model namespace, rest forwards to primary', () => {
    const insertSpy = vi.fn()
    const updateSpy = vi.fn()
    const control = fakeClient('fz-control', ['fzUser'], {
      mutate: { fzUser: { insert: insertSpy } },
      userID: 'primary-user',
    })
    const project = fakeClient('fz-project', ['fzTask'], {
      mutate: { fzTask: { update: updateSpy } },
      userID: 'project-user',
    })

    const combined = combineZeroClients(control, project)
    const zero = combined.zero as Record<string, any>

    zero.mutate.fzUser.insert({ id: '1' })
    zero.mutate.fzTask.update({ id: '2' })

    expect(insertSpy).toHaveBeenCalledWith({ id: '1' })
    expect(updateSpy).toHaveBeenCalledWith({ id: '2' })
    expect(zero.userID).toBe('primary-user')
    // unclaimed namespaces fall back to the primary instance
    expect(zero.mutate.unknownNs).toBe(undefined)
  })

  test('useQuery/preload/getQuery/usePermission dispatch by namespace', () => {
    const control = fakeClient('fq-control', ['fqUser'], {})
    const project = fakeClient('fq-project', ['fqTask'], {})
    const userQuery = makeQueryFn()
    const taskQuery = makeQueryFn()
    registerQuery(userQuery, 'fqUser.byId')
    registerQuery(taskQuery, 'fqTask.byId')

    // project is last → inner: its hooks ride the upstream context path;
    // control is outer → its hooks go through the context-free direct path
    const combined = combineZeroClients(control, project)
    const useQuery = combined.useQuery as (...args: any[]) => any
    const preload = combined.preload as (...args: any[]) => any
    const getQuery = combined.getQuery as (...args: any[]) => any
    const usePermission = combined.usePermission as (...args: any[]) => any

    useQuery(userQuery, { id: '1' })
    expect(control.useQueryDirect).toHaveBeenCalledWith(userQuery, { id: '1' })
    expect(control.useQuery).not.toHaveBeenCalled()
    expect(project.useQuery).not.toHaveBeenCalled()

    useQuery(taskQuery, { id: '2' })
    expect(project.useQuery).toHaveBeenCalledWith(taskQuery, { id: '2' })
    expect(project.useQueryDirect).not.toHaveBeenCalled()

    preload(taskQuery, { id: '3' })
    expect(project.preload).toHaveBeenCalledWith(taskQuery, { id: '3' })
    expect(control.preload).not.toHaveBeenCalled()

    getQuery(userQuery, { id: '4' })
    expect(control.getQuery).toHaveBeenCalledWith(userQuery, { id: '4' })
    expect(project.getQuery).not.toHaveBeenCalled()

    // unregistered query fns fall back to the primary instance (outer → direct)
    const anonymous = makeQueryFn()
    useQuery(anonymous, { id: '5' })
    expect(control.useQueryDirect).toHaveBeenCalledWith(anonymous, { id: '5' })

    // usePermission dispatches by table-named model namespace and follows the
    // same context vs direct split: inner table → context, outer table → direct
    usePermission('fqTask', 'row-1')
    expect(project.usePermission).toHaveBeenCalledWith('fqTask', 'row-1')
    expect(project.usePermissionDirect).not.toHaveBeenCalled()

    usePermission('fqUser', 'row-2')
    expect(control.usePermissionDirect).toHaveBeenCalledWith('fqUser', 'row-2')
    expect(control.usePermission).not.toHaveBeenCalled()
  })

  test('the inner option overrides which client uses the context path', () => {
    const a = fakeClient('inner-a', ['innerA'], {})
    const b = fakeClient('inner-b', ['innerB'], {})
    const aQuery = makeQueryFn()
    const bQuery = makeQueryFn()
    registerQuery(aQuery, 'innerA.byId')
    registerQuery(bQuery, 'innerB.byId')

    // a is FIRST (primary) but declared inner → context path; b becomes direct
    const combined = combineZeroClients(a, b, { inner: 'inner-a' })
    const useQuery = combined.useQuery as (...args: any[]) => any

    useQuery(aQuery, { id: '1' })
    expect(a.useQuery).toHaveBeenCalledWith(aQuery, { id: '1' })
    expect(a.useQueryDirect).not.toHaveBeenCalled()

    useQuery(bQuery, { id: '2' })
    expect(b.useQueryDirect).toHaveBeenCalledWith(bQuery, { id: '2' })
    expect(b.useQuery).not.toHaveBeenCalled()

    expect(() => combineZeroClients(a, b, { inner: 'nope' })).toThrow(
      /not one of the passed clients/,
    )
  })

  test('combined zeroEvents relays every instance', () => {
    const { client: a } = makeClient('relay-a', 'relayA')
    const { client: b } = makeClient('relay-b', 'relayB')

    const combined = combineZeroClients(a, b)
    const seen: Array<ZeroEvent | null> = []
    combined.zeroEvents.listen((event) => seen.push(event))

    a.zeroEvents.emit({ type: 'error', message: 'from-a' })
    b.zeroEvents.emit({ type: 'error', message: 'from-b' })

    const messageOf = (event: ZeroEvent | null) =>
      event?.type === 'error' ? event.message : undefined
    expect(seen.map(messageOf)).toEqual(['from-a', 'from-b'])
    // the source emitters stay independent of each other
    expect(messageOf(a.zeroEvents.value)).toBe('from-a')
    expect(messageOf(b.zeroEvents.value)).toBe('from-b')
  })
})
