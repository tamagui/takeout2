import { Where } from './types'

const mutationsToPermissionsRegistry = new Map<string, Where>()

export function setMutationsPermissions(tableName: string, permissions: Where) {
  mutationsToPermissionsRegistry.set(tableName, permissions)
}

export function getMutationsPermissions(tableName: string): Where | undefined {
  return mutationsToPermissionsRegistry.get(tableName)
}
