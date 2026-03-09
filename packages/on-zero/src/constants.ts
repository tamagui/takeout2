import { isServerRuntime } from '@take-out/helpers'

// VITE_ENVIRONMENT is replaced at build time enabling DCE in client bundles
// isServerRuntime() handles non-vite environments (plain node/bun)
export const isServer =
  process.env.VITE_ENVIRONMENT === 'ssr' ||
  (process.env.VITE_ENVIRONMENT !== 'client' && isServerRuntime())

export const isBrowser = !isServer
