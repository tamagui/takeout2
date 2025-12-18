import { globalValue } from '@take-out/helpers'

import type { MutatorContext } from '../types'

const PermissionCheckRan = globalValue(
  `over-zero:permissions-check`,
  () => new WeakMap<MutatorContext, boolean>()
)

export const getDidRunPermissionCheck = (ctx: MutatorContext) => {
  return PermissionCheckRan.get(ctx)
}

export const setDidRunPermissionCheck = (ctx: MutatorContext) => {
  return PermissionCheckRan.set(ctx, true)
}
