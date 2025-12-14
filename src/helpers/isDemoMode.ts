// helper to check if demo mode is enabled
// uses a getter to ensure consistent evaluation at runtime
export function getIsDemoMode(): boolean {
  return import.meta.env.DEV || !!import.meta.env.VITE_DEMO_MODE
}

// backward compatible constant
export const isDemoMode = getIsDemoMode()
