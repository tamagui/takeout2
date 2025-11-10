import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const TUNNEL_CONFIG_DIR = join(homedir(), '.onechat-tunnel')
const TUNNEL_URL_FILE = join(TUNNEL_CONFIG_DIR, 'tunnel-url.txt')

export function getTunnelUrl(): string | null {
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  try {
    if (existsSync(TUNNEL_URL_FILE)) {
      const url = readFileSync(TUNNEL_URL_FILE, 'utf-8').trim()
      return url || null
    }
  } catch (error) {
    console.error('Error reading tunnel URL:', error)
  }

  return null
}

export function getServerUrlOrTunnelUrlIfLocal(): string {
  const tunnelUrl = getTunnelUrl()
  if (tunnelUrl) {
    console.info('Using tunnel URL for webhooks:', tunnelUrl)
    return tunnelUrl
  }

  const serverUrl = process.env.ONE_SERVER_URL || 'http://localhost:8262'

  if (serverUrl.includes('0.0.0.0') || serverUrl.includes('localhost')) {
    const localUrl = serverUrl.replace('0.0.0.0', 'localhost')
    console.info('Replacing 0.0.0.0/localhost with tunnel url', localUrl)
    return localUrl
  }

  return serverUrl
}
