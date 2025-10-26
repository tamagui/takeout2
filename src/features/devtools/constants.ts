/**
 * Debug level for logging
 * 0 = no debug output
 * 1 = minimal debug output
 * 2 = verbose debug output
 */
export const DEBUG_LEVEL = process.env.NODE_ENV === 'development' ? 1 : 0
