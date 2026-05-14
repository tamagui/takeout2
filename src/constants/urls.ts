import { getURL } from 'one'

export const SERVER_URL = (() => {
  // browser: infer from location
  if (typeof location !== 'undefined') {
    return `${location.protocol}//${location.host}`
  }

  // server/native: use One's getURL or fallback
  const url = getURL()
  if (url === 'http://one-server.example.com') {
    // release build - prefer baked-in production hostname, then dev fallback
    const host = import.meta.env.VITE_WEB_HOSTNAME
    if (host && host !== 'localhost:8081') {
      return `https://${host}`
    }
    return 'http://localhost:8081'
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
  if (!host) return 'http://localhost:4848'
  // local dev zero server only speaks http — only switch to https off-localhost
  const protocol =
    host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https'
  return `${protocol}://${host}`
})()

export const DEFAULT_HOT_UPDATE_SERVER_URL =
  'https://huosdtejcaqhwgpdubyd.supabase.co/functions/v1/update-server'

export const API_URL = `${SERVER_URL}/api`
export const AUTH_URL = `${SERVER_URL}/api/auth`
