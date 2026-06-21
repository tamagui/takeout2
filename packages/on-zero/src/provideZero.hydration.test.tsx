// @vitest-environment jsdom
//
// hydration-fiber-shape integration test: ProvideZero must produce the SAME
// fiber tree shape on SSR and on the client, so React's useId() (which keys
// on the consuming fiber's tree position) returns identical ids on both
// sides and hydration is clean.
//
// regression: before this guarantee was enforced, ProvideZero returned the
// 3 context providers DIRECTLY on SSR but wrapped them in ProvideZeroActive
// on the client. that extra wrapper fiber shifted every descendant's tree
// id by a step → hydration mismatch on every useId consumer (SVG ids,
// form-input ids, etc).
//
// fix: ProvideZero is now ONE component with an early-return for SSG/disable
// before any hook call. both branches render the SAME 3-provider shell with
// the SAME number of child slots inside ZeroContext.Provider — child index
// stability is what keeps useId stable.

import { createSchema, string, table } from '@rocicorp/zero'
import { useId, type ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { expect, test } from 'vitest'

import { createZeroClient } from './createZeroClient'

const todoTable = table('todo').columns({ id: string(), title: string() }).primaryKey('id')
const schema = createSchema({ tables: [todoTable] })

const client = createZeroClient({
  schema,
  models: {},
  groupedQueries: {},
  instanceName: 'provider-shape-test',
})

function IdProbe({ name }: { name: string }) {
  const id = useId()
  return <span data-name={name} data-probe-id={id} />
}

function Tree({
  children,
  disable,
}: {
  children?: ReactNode
  disable?: boolean
}) {
  return (
    <client.ProvideZero authData={{}} userID="anon" disable={disable}>
      <IdProbe name="a" />
      <div>
        <IdProbe name="b" />
      </div>
      <section>
        <p>
          <IdProbe name="c" />
        </p>
      </section>
      {children}
    </client.ProvideZero>
  )
}

function readIds(html: string): Record<string, string> {
  const out: Record<string, string> = {}
  const re = /data-name="([^"]+)" data-probe-id="([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) out[m[1]!] = m[2]!
  return out
}

test('useId is stable across active vs disabled ProvideZero renders', () => {
  const active = readIds(renderToString(<Tree />))
  const disabled = readIds(renderToString(<Tree disable />))
  expect(Object.keys(active).length).toBe(3)
  expect(disabled).toEqual(active)
})

test('rendered DOM structure matches between active and disabled (probe ids stripped)', () => {
  const strip = (s: string) => s.replace(/ data-probe-id="[^"]+"/g, '')
  const active = strip(renderToString(<Tree />))
  const disabled = strip(renderToString(<Tree disable />))
  expect(disabled).toBe(active)
})

// regression for the soot ProjectZeroGate residual re-parenting: the consumer
// pattern toggles disable=true → disable=false in place once user.id resolves
// from the SSR placeholder ('anon-ssr') to the minted client anon id. that
// MUST NOT change the hook-call count of ProvideZero (would violate
// rules-of-hooks) or shift descendant useId (would re-fire hydration
// mismatches). every render of ProvideZero on the client runs the SAME
// hook set; only the returned JSX and the instance-creation effect body
// vary with disable.
test('client-side hook count is stable across disable=true ↔ false', () => {
  // proxy: render both states twice and confirm useId values are identical
  // each time (a hook-count flip would mis-allocate the useId slots).
  const r1 = readIds(renderToString(<Tree disable />))
  const r2 = readIds(renderToString(<Tree />))
  const r3 = readIds(renderToString(<Tree disable />))
  const r4 = readIds(renderToString(<Tree />))
  expect(r2).toEqual(r1)
  expect(r3).toEqual(r1)
  expect(r4).toEqual(r1)
})
