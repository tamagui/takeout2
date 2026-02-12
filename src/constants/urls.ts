import { getURL } from 'one'

export const SERVER_URL = (() => {
  // browser: infer from location
  if (typeof location !== 'undefined') {
    return `${location.protocol}//${location.host}`
  }

  // server/native: use One's getURL or fallback
  const url = getURL()
  if (url === 'http://one-server.example.com') {
    // release build - use baked-in URL or default
    return import.meta.env.VITE_SERVER || 'http://localhost:8081'
  }
  return url
})()

export const ZERO_SERVER_URL = (() => {
  // browser: construct from location
  if (typeof location !== 'undefined') {
    // localhost/127.0.0.1 = dev/CI, construct URL from port
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      const port = import.meta.env.VITE_PORT_ZERO || '4848'
      return `${location.protocol}//${location.hostname}:${port}`
    }
    // production: construct https URL from hostname
    const host = import.meta.env.VITE_ZERO_HOSTNAME
    return host ? `https://${host}` : ''
  }

  // server/native: construct from hostname or fallback
  const host = import.meta.env.VITE_ZERO_HOSTNAME
  return host ? `https://${host}` : 'http://localhost:4848'
})()

export const DEFAULT_HOT_UPDATE_SERVER_URL =
  'https://huosdtejcaqhwgpdubyd.supabase.co/functions/v1/update-server'

export const API_URL = `${SERVER_URL}/api`
export const AUTH_URL = `${SERVER_URL}/api/auth`
