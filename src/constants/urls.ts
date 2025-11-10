import { getURL } from 'one'

// TODO

// Server URLs configuration
// Force localhost on client to avoid 0.0.0.0 CORS issues
const rawServerUrl = process.env.ONE_SERVER_URL || 'http://localhost:8262'

export const SERVER_URL = (() => {
  // For production and staging web, we can infer the server URL from location.
  if (typeof location !== 'undefined') {
    return `${location.protocol}//${location.host}`
  }

  // In dev build this will return the dev server URL where the bundle is being served from.
  let url = getURL()

  // FIXME?: [One] prod ONE_SERVER_URL not working in metro
  if (
    url ===
    'http://one-server.example.com' /* Means that this is not running through dev server but is a release build */
  ) {
    // Default to production URL if not set
    url = import.meta.env.VITE_PUBLIC_SERVER || 'https://fleekapp.fxy.dev'
  }
  return url
})()

export const ZERO_SERVER_URL = (() => {
  // For production and staging web, we can infer the zero server URL from location.
  if (typeof location !== 'undefined') {
    if (location.host === 'fleekapp.fxy.dev') {
      return 'https://zero.fleekapp.fxy.dev'
    }

    if (location.host === 'staging.fleekapp.fxy.dev') {
      return 'https://zero.staging.fleekapp.fxy.dev'
    }
  }

  // In dev build this will return the dev server URL where the bundle is being served from.
  let serverUrl = getURL()
  if (
    serverUrl ===
    'http://one-server.example.com' /* Means that this is not running through dev server but is a release build */
  ) {
    // Default to production URL if not set
    return import.meta.env.VITE_PUBLIC_ZERO_SERVER || 'https://zero.fleekapp.fxy.dev'
  } else {
    return import.meta.env.VITE_PUBLIC_ZERO_SERVER || 'http://localhost:4848'
  }
})()

// TODO
export const DEFAULT_HOT_UPDATE_SERVER_URL =
  'https://pckjvzbtdczlpkgujgkb.supabase.co/functions/v1/update-server'

export const API_URL = `${SERVER_URL}/api`
export const AUTH_URL = `${SERVER_URL}/api/auth`
