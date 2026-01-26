import * as one from 'one'

/**
 * This file is a simple way to easily put lots of stuff you want easy
 * to introspect onto a single "Dev" global in dev mode. Also can pass
 * a destroyer so on HMR it properly cleans up the last thing
 */

type DestroyFn<X> = (instance: X) => void
type DevGlobals = Record<string, any>
type DevDestroys = Record<string, DestroyFn<any> | undefined>

export function getDevGlobal(name?: string) {
  const devGlobal = (globalThis as any)['Dev'] as DevGlobals | undefined
  return name && devGlobal ? devGlobal[name] : devGlobal
}

const Dev: DevGlobals = getDevGlobal() ?? {}
;(globalThis as any)['Dev'] ||= Dev

const _globalDestroys = (globalThis as any)['_DevDestroys'] as DevDestroys | undefined
const DevDestroys: DevDestroys = _globalDestroys ?? {}
;(globalThis as any)['_DevDestroys'] ||= DevDestroys

export function setDevGlobal<Obj>(object: Obj, name: string, destroy?: DestroyFn<Obj>) {
  const destroyer = DevDestroys[name]
  const prev = getDevGlobal(name)
  destroyer?.(prev)
  DevDestroys[name] = destroy
  Dev[name] = object
  return object
}

setDevGlobal(one, 'one')
