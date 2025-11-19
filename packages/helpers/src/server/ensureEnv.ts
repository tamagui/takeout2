// note doesnt work on client because Vite injects process.env

export function ensureEnv(name: string, defaultValue?: string): string {
  if (typeof process.env[name] === 'string') {
    return process.env[name] || defaultValue || ''
  }
  if (defaultValue !== undefined) {
    return defaultValue
  }
  if (process.env.ALLOW_MISSING_ENV) {
    return ''
  }
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    if (typeof defaultValue === 'undefined') {
      console.warn(` - missing env ${name}`)
    }
    return ''
  }
  throw new Error(`Environment variable ${name} not set.`)
}
