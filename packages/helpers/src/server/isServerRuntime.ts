export function isServerRuntime(): boolean {
  // explicit env override (vite replaces at build time, enabling DCE)
  if (process.env.VITE_ENVIRONMENT === 'ssr') return true
  if (process.env.VITE_ENVIRONMENT === 'client') return false
  // auto-detect node/bun server runtime
  return (
    typeof process !== 'undefined' &&
    !!process.versions &&
    !!(process.versions.node || (process.versions as any).bun)
  )
}
