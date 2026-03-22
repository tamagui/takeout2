const getDebugLevelFromUrl = (): number | null => {
  if (typeof window === 'undefined') return null
  const match = window.location?.search?.match(/debug=(\d+)/)
  return match?.[1] ? parseInt(match[1], 10) : null
}

export const DEBUG_LEVEL = process.env.DEBUG_LEVEL
  ? +process.env.DEBUG_LEVEL
  : (getDebugLevelFromUrl() ?? (process.env.NODE_ENV === 'development' ? 1 : 0))
