// Server URLs configuration
// Force localhost on client to avoid 0.0.0.0 CORS issues
const rawServerUrl = process.env.ONE_SERVER_URL || 'http://localhost:3000'
export const SERVER_URL =
  typeof window !== 'undefined' && rawServerUrl.includes('0.0.0.0')
    ? rawServerUrl.replace('0.0.0.0', 'localhost')
    : rawServerUrl

export const API_URL = `${SERVER_URL}/api`
export const AUTH_URL = `${SERVER_URL}/api/auth`
