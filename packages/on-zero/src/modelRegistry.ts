import type { Where } from './types'

function mutationsToPermissionsRegistry(): Map<string, Where> {
  const global = globalThis as typeof globalThis & {
    __onZeroMutationPermissionsRegistry__?: Map<string, Where>
  }
  return (global.__onZeroMutationPermissionsRegistry__ ||= new Map())
}

export function setMutationsPermissions(tableName: string, permissions: Where) {
  mutationsToPermissionsRegistry().set(tableName, permissions)
}

export function getMutationsPermissions(tableName: string): Where | undefined {
  return mutationsToPermissionsRegistry().get(tableName)
}

export function getAllMutationsPermissions(): Map<string, Where> {
  return mutationsToPermissionsRegistry()
}
