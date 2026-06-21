// @vitest-environment jsdom
//
// real nested-provider tests for combineZeroClients: zero-react's useQuery
// resolves its zero instance from the NEAREST ZeroProvider context, so under
// nested providers an outer instance's queries must NOT ride the context
// path — they must materialize directly on the owning instance.

import { createSchema, string, table } from '@rocicorp/zero'
import { useZero } from '@rocicorp/zero/react'
import { act, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { createZeroClient } from './createZeroClient'
import { combineZeroClients, createZeroClientWithDirectQueries } from './multi'
import { zql } from './zql'

import type { MutatorContext } from './types'
import type { ReactNode } from 'react'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const userTable = table('user').columns({ id: string(), name: string() }).primaryKey('id')
const taskTable = table('task')
  .columns({ id: string(), title: string() })
  .primaryKey('id')
const schema = createSchema({ tables: [userTable, taskTable] })

type UserRow = { id: string; name: string }

// control = OUTER/primary instance — owns the 'user' model namespace and the
// 'ctlUser' query namespace
const controlModels = {
  user: {
    mutate: {
      seed: async (ctx: MutatorContext, row?: UserRow) => {
        await (ctx.tx.mutate as any).user.upsert(row)
      },
    },
  },
}
const ctlUserById = (args: { id: string }) => (zql as any).user.where('id', args.id).one()

const control = createZeroClientWithDirectQueries({
  schema,
  models: controlModels,
  groupedQueries: { ctlUser: { byId: ctlUserById } },
  instanceName: 'nested-control',
})

// project = INNER instance — its own store. its seed mutator writes the same
// user TABLE (tables are physical, only namespaces are claims) so the two
// stores can hold conflicting rows for the same id.
const projectModels = {
  prjSeed: {
    mutate: {
      seedUser: async (ctx: MutatorContext, row?: UserRow) => {
        await (ctx.tx.mutate as any).user.upsert(row)
      },
    },
  },
}
const prjTaskById = (args: { id: string }) => (zql as any).task.where('id', args.id).one()

const project = createZeroClient({
  schema,
  models: projectModels,
  groupedQueries: { prjTask: { byId: prjTaskById } },
  instanceName: 'nested-project',
})

// default contract: last argument = inner provider
const combined = combineZeroClients(control, project)

let root: Root
let container: HTMLElement

beforeEach(() => {
  resetProbe()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
  container.remove()
})

const render = (ui: ReactNode) => act(async () => root.render(ui))

async function waitFor(condition: () => boolean, what: string) {
  for (let i = 0; i < 200; i++) {
    if (condition()) return
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))
    })
  }
  throw new Error(`timed out waiting for ${what}`)
}

const probe: { data: UserRow | undefined; renders: number } = {
  data: undefined,
  renders: 0,
}
const materializeProbe: {
  materializeTtls: unknown[]
  updateTtls: unknown[]
  destroys: number
} = {
  materializeTtls: [],
  updateTtls: [],
  destroys: 0,
}

// reset via helper so the assignments don't narrow probe.data to undefined
// in test scope
function resetProbe() {
  probe.data = undefined
  probe.renders = 0
  materializeProbe.materializeTtls = []
  materializeProbe.updateTtls = []
  materializeProbe.destroys = 0
}

function ControlUserProbe({ id, ttl }: { id: string; ttl?: number }) {
  const [data] =
    ttl === undefined
      ? (combined.useQuery as any)(ctlUserById, { id })
      : (combined.useQuery as any)(ctlUserById, { id }, { ttl })
  probe.data = data ?? undefined
  probe.renders++
  return null
}

function MaterializeProbe() {
  const zero = useZero() as any
  // ProvideZero hands children a stub Zero (no .materialize) until the real
  // instance is created in an effect. skip on the stub render.
  if (typeof zero.materialize !== 'function') return null
  if (!zero.__onZeroMaterializeProbe) {
    zero.__onZeroMaterializeProbe = true
    const materialize = zero.materialize.bind(zero)
    zero.materialize = (...args: any[]) => {
      materializeProbe.materializeTtls.push(args[1]?.ttl)
      const view = materialize(...args)
      const updateTTL = view.updateTTL.bind(view)
      view.updateTTL = (ttl: unknown) => {
        materializeProbe.updateTtls.push(ttl)
        return updateTTL(ttl)
      }
      const destroy = view.destroy.bind(view)
      view.destroy = () => {
        materializeProbe.destroys++
        return destroy()
      }
      return view
    }
  }
  return null
}

const seedControl = async (row: UserRow) => {
  await act(async () => {
    await (control.zero.mutate as any).user.seed(row).client
  })
}

const seedProject = async (row: UserRow) => {
  await act(async () => {
    await (project.zero.mutate as any).prjSeed.seedUser(row).client
  })
}

test('outer-instance query reads the OUTER store under nested providers', async () => {
  await render(
    <control.ProvideZero server={null} userID="t1-ctl">
      <project.ProvideZero server={null} userID="t1-prj">
        <ControlUserProbe id="u1" />
      </project.ProvideZero>
    </control.ProvideZero>,
  )
  await waitFor(() => probe.renders > 0, 'probe mount')

  // same row id, conflicting values per store — whichever store the view
  // materialized against decides the rendered name
  await seedControl({ id: 'u1', name: 'from-control' })
  await seedProject({ id: 'u1', name: 'from-project' })

  await waitFor(() => probe.data !== undefined, 'control row visible')
  expect(probe.data?.name).toBe('from-control')
})

test('inner provider unmount/remount does not break outer-instance subscriptions', async () => {
  const App = ({ showInner }: { showInner: boolean }) => (
    <control.ProvideZero server={null} userID="t2-ctl">
      {showInner ? (
        <project.ProvideZero server={null} userID="t2-prj">
          <ControlUserProbe id="u2" />
        </project.ProvideZero>
      ) : (
        <ControlUserProbe id="u2" />
      )}
    </control.ProvideZero>
  )

  await render(<App showInner />)
  await waitFor(() => probe.renders > 0, 'probe mount')

  await seedControl({ id: 'u2', name: 'v1' })
  await waitFor(() => probe.data?.name === 'v1', 'v1 visible')

  // unmount the inner provider (probe remounts outside it)
  await render(<App showInner={false} />)
  await seedControl({ id: 'u2', name: 'v2' })
  await waitFor(() => probe.data?.name === 'v2', 'v2 visible after inner unmount')

  // remount the inner provider
  await render(<App showInner />)
  await seedControl({ id: 'u2', name: 'v3' })
  await waitFor(() => probe.data?.name === 'v3', 'v3 visible after inner remount')
})

test('StrictMode: direct views survive the effect double-invoke', async () => {
  // StrictMode (and any suspense hide/reveal) runs effect cleanup + re-setup
  // with unchanged deps: the cleanup destroys the materialized view while the
  // memoized store identity survives, so without re-materialization on
  // resubscribe the snapshot freezes at its mount-time value forever — the
  // "control queries strand at result type unknown" bug (soot 3e6ecd10a)
  await render(
    <StrictMode>
      <control.ProvideZero server={null} userID="t4-ctl">
        <project.ProvideZero server={null} userID="t4-prj">
          <ControlUserProbe id="u4" />
        </project.ProvideZero>
      </control.ProvideZero>
    </StrictMode>,
  )
  await waitFor(() => probe.renders > 0, 'probe mount')

  await seedControl({ id: 'u4', name: 'strict-v1' })
  await waitFor(() => probe.data?.name === 'strict-v1', 'update visible under StrictMode')

  await seedControl({ id: 'u4', name: 'strict-v2' })
  await waitFor(() => probe.data?.name === 'strict-v2', 'second update still live')
})

test('direct-path subscribers share one materialized view', async () => {
  const App = ({ showSubscribers }: { showSubscribers: boolean }) => (
    <control.ProvideZero server={null} userID="t5-ctl">
      <MaterializeProbe />
      <project.ProvideZero server={null} userID="t5-prj">
        {showSubscribers ? (
          <>
            <ControlUserProbe id="u5" ttl={1000} />
            <ControlUserProbe id="u5" ttl={2000} />
          </>
        ) : null}
      </project.ProvideZero>
    </control.ProvideZero>
  )

  await render(<App showSubscribers />)
  await waitFor(() => probe.renders >= 2, 'both probes mount')

  expect(materializeProbe.materializeTtls).toEqual([1000])
  expect(materializeProbe.updateTtls).toEqual([2000])

  await seedControl({ id: 'u5', name: 'shared-v1' })
  await waitFor(() => probe.data?.name === 'shared-v1', 'shared view update visible')
  expect(materializeProbe.materializeTtls).toEqual([1000])

  await render(<App showSubscribers={false} />)
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
  expect(materializeProbe.destroys).toBe(1)
})

test('direct-path views re-materialize when the owning instance rotates', async () => {
  const App = ({ userID }: { userID: string }) => (
    <control.ProvideZero server={null} userID={userID}>
      <ControlUserProbe id="u3" />
    </control.ProvideZero>
  )

  await render(<App userID="rot-1" />)
  await waitFor(() => probe.renders > 0, 'probe mount')

  await seedControl({ id: 'u3', name: 'before-rotation' })
  await waitFor(() => probe.data?.name === 'before-rotation', 'pre-rotation row')

  // identity change rotates the mounted zero instance (new client group,
  // fresh store) via the instanceKey change
  await render(<App userID="rot-2" />)
  await waitFor(() => probe.data === undefined, 'view reset to the new empty store')

  await seedControl({ id: 'u3', name: 'after-rotation' })
  await waitFor(() => probe.data?.name === 'after-rotation', 'post-rotation row')
})
