// @vitest-environment jsdom
//
// useQuery's typed contract is `[T[], info]` for plural queries. The empty /
// loading / disabled response MUST therefore be `[[], info]` — returning
// `[null, info]` (the old EMPTY_RESPONSE constant) broke any caller that does
// the obvious .filter / .find / .length / for-of on first render. Singular
// queries get `[undefined, info]` instead (the established zero-react shape).

import { createSchema, number, string, table } from '@rocicorp/zero'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { createZeroClient } from './createZeroClient'
import { zql } from './zql'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const todoTable = table('todo')
  .columns({ id: string(), title: string(), createdAt: number() })
  .primaryKey('id')
const schema = createSchema({ tables: [todoTable] })

// real plain query functions backed by zql so resolveQuery returns a real
// QueryRequest (asQueryInternals(...).format.singular works).
const allTodos = (_args: void) =>
  (zql as unknown as { todo: { orderBy: (k: string, d: string) => any } }).todo.orderBy(
    'createdAt',
    'desc',
  )
const oneTodo = (args: { id: string }) =>
  (zql as unknown as { todo: { where: (k: string, v: string) => any } }).todo
    .where('id', args.id)
    .one()

const client = createZeroClient({
  schema,
  models: {},
  groupedQueries: {
    todo: { allTodos, oneTodo },
  },
  instanceName: 'empty-shape-test',
})

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
})

function renderWithDisabled<T>(useHook: () => T): T {
  let captured: T | undefined
  const Probe = () => {
    captured = useHook()
    return null
  }
  act(() => {
    // disable=true mounts the stable shell with DisabledContext='empty' + a
    // stub Zero — this is exactly the path that used to return [null, ...]
    // for every query.
    root.render(
      <client.ProvideZero authData={{}} userID="anon" disable>
        <Probe />
      </client.ProvideZero>,
    )
  })
  if (captured === undefined) throw new Error('Probe did not render')
  return captured
}

// regression: previously this returned [null, ...] which crashed downstream
// .filter / .find / .length. now it must return [[], ...] for plural queries.
test('useQuery returns [] (not null) for plural queries under DisabledContext', () => {
  const [data, info] = renderWithDisabled(() => client.useQuery(allTodos))
  expect(Array.isArray(data)).toBe(true)
  expect((data as unknown[]).length).toBe(0)
  // method calls that previously crashed must not crash
  expect((data as unknown[]).filter(() => true)).toEqual([])
  expect((data as unknown[]).find(() => true)).toBeUndefined()
  expect(info?.type).toBe('unknown')
})

test('useQuery returns undefined (not null) for singular queries under DisabledContext', () => {
  const [data, info] = renderWithDisabled(() => client.useQuery(oneTodo, { id: 'x' }))
  // singular queries match zero-react: data is undefined while loading/disabled.
  expect(data).toBeUndefined()
  expect(info?.type).toBe('unknown')
})
