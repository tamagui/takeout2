// @vitest-environment jsdom
//
// authData stabilization: ProvideZero keeps the last non-null authData across a
// transient blip (session refresh / tab wake) so mutations never see null
// mid-transition — but a REAL logout (auth token gone) must clear it, or client
// mutators keep running as the old user until the instance rotates.

import { createSchema, string, table } from '@rocicorp/zero'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { createZeroClient } from './createZeroClient'
import { getAuthData } from './state'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const userTable = table('user').columns({ id: string(), name: string() }).primaryKey('id')
const schema = createSchema({ tables: [userTable] })

const client = createZeroClient({
  schema,
  models: {},
  groupedQueries: {},
  instanceName: 'authdata-test',
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

function renderWith(props: {
  auth?: string
  authData: { id: string } | null
  userID: string
}) {
  act(() => {
    root.render(
      <client.ProvideZero
        auth={props.auth}
        authData={props.authData}
        userID={props.userID}
      >
        <span>ok</span>
      </client.ProvideZero>,
    )
  })
}

test('authData clears on logout (token gone) but survives a transient blip', () => {
  renderWith({ auth: 'tok', authData: { id: 'u1' }, userID: 'u1' })
  expect(getAuthData()).toEqual({ id: 'u1' })

  // transient authData blip with the token still present → keep the last value
  renderWith({ auth: 'tok', authData: null, userID: 'u1' })
  expect(getAuthData()).toEqual({ id: 'u1' })

  // real logout: no token + no authData → cleared (mutators must not run as u1)
  renderWith({ authData: null, userID: 'anon' })
  expect(getAuthData()).toBeNull()
})
