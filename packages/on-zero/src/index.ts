export * from './createPermissions'
export * from './queryRegistry'
export * from './helpers/batchQuery'
export * from './helpers/createMutators'
export * from './helpers/ensureLoggedIn'
export * from './helpers/mutatorContext'
export { ensureAuth, getAuth } from './helpers/getAuth'
export { setAuthData, setEnvironment } from './state'

export * from './createZeroClient'
export * from './createUseQuery'
export * from './resolveQuery'
export * from './run'
export { setRunner, type ZeroRunner } from './zeroRunner'
export * from './mutations'
export * from './where'
export * from './serverWhere'
export * from './zql'

// drizzle-zero re-exports moved to 'on-zero/drizzle' to avoid pulling
// drizzle-zero + drizzle-orm/_relations into the main bundle
// (breaks vite dep optimization under vxrn-web conditions)

export type * from './types'
