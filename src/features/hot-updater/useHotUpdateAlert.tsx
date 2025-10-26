/**
 * Web version of hot update alert - no-op implementation
 * Hot updates are only supported on native platforms
 */
export function useHotUpdateAlert() {
  // no-op on web since hot updates are not supported
  return null
}
