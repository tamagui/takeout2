// @vitest-environment jsdom
//
// real nested-provider tests for combineZeroClients: zero-react's useQuery
// resolves its zero instance from the NEAREST ZeroProvider context, so under
// nested providers an outer instance's queries must NOT ride the context
// path — they must materialize directly on the owning instance.

import { createSchema, string, table } from '@rocicorp/zero'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { combineZeroClients } from './combineZeroClients'
import { createZeroClient } from './createZeroClient'
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

const control = createZeroClient({
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

// reset via helper so the assignments don't narrow probe.data to undefined
// in test scope
function resetProbe() {
  probe.data = undefined
  probe.renders = 0
}

function ControlUserProbe({ id }: { id: string }) {
  const [data] = (combined.useQuery as any)(ctlUserById, { id })
  probe.data = data ?? undefined
  probe.renders++
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
  // fresh store) — the same mechanism a zeroInstanceGeneration bump uses
  await render(<App userID="rot-2" />)
  await waitFor(() => probe.data === undefined, 'view reset to the new empty store')

  await seedControl({ id: 'u3', name: 'after-rotation' })
  await waitFor(() => probe.data?.name === 'after-rotation', 'post-rotation row')
})
