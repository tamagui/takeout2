#!/usr/bin/env bun

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const TUNNEL_CONFIG_DIR = join(homedir(), '.onechat-tunnel')
const TUNNEL_ID_FILE = join(TUNNEL_CONFIG_DIR, 'tunnel-id.txt')
const TUNNEL_CONFIG_FILE = join(TUNNEL_CONFIG_DIR, 'config.yml')

// check internet connectivity first
async function checkInternetConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    // try to ping cloudflare dns
    const pingProcess = spawn('ping', ['-c', '1', '-W', '2', '1.1.1.1'], {
      stdio: 'pipe',
    })

    pingProcess.on('error', () => {
      resolve(false)
    })

    pingProcess.on('exit', (code) => {
      resolve(code === 0)
    })
  })
}

// check connectivity before proceeding
const isOnline = await checkInternetConnection()
if (!isOnline) {
  console.info('📵 Offline - skipping tunnel setup')
  // Keep process alive for watch mode
  await new Promise(() => {})
}

// ensure config dir exists
if (!existsSync(TUNNEL_CONFIG_DIR)) {
  mkdirSync(TUNNEL_CONFIG_DIR, { recursive: true })
}

// check if cloudflared is authenticated
const certPath = join(homedir(), '.cloudflared', 'cert.pem')
const hasCloudflaredAuth = existsSync(certPath)

if (!hasCloudflaredAuth) {
  console.info('☁️  Tunnel not set up. Run "bun dev:tunnel" to enable.')
  // Keep process alive for watch mode
  await new Promise(() => {})
}

// check if we have a tunnel id
const hasTunnelId = existsSync(TUNNEL_ID_FILE)
if (!hasTunnelId) {
  console.info('☁️  No tunnel created. Run "bun dev:tunnel" once to set up.')
  // Keep process alive for watch mode
  await new Promise(() => {})
}

// check if cloudflared is installed
const checkProcess = spawn('which', ['cloudflared'], {
  shell: true,
  stdio: 'pipe',
})

checkProcess.on('error', () => {
  console.warn('⚠️  cloudflared not found - skipping tunnel setup')
  // Keep process alive for watch mode
  new Promise(() => {})
})

checkProcess.on('exit', async (code) => {
  if (code === 0) {
    const tunnelId = readFileSync(TUNNEL_ID_FILE, 'utf-8').trim()
    const tunnelName = 'onechat-dev-n8' // your tunnel name
    console.info(`🚇 Starting tunnel ${tunnelId}...`)

    // The stable URL format for your domain
    const tunnelDomain = `${tunnelName}.start.chat`

    // Create config file with ingress rules
    const tunnelConfig = `
tunnel: ${tunnelId}
credentials-file: ${join(homedir(), '.cloudflared', `${tunnelId}.json`)}

ingress:
  - hostname: ${tunnelDomain}
    service: http://localhost:8262
  - service: http_status:404
`
    writeFileSync(TUNNEL_CONFIG_FILE, tunnelConfig)

    // Set up DNS route if needed (this is idempotent, safe to run multiple times)
    const routeProcess = spawn(
      'cloudflared',
      ['tunnel', 'route', 'dns', tunnelId, tunnelDomain],
      {
        stdio: 'pipe',
        shell: true,
      }
    )

    await new Promise((resolve) => {
      routeProcess.on('exit', resolve)
    })

    const tunnelUrl = `https://${tunnelDomain}`
    const tunnelUrlFile = join(TUNNEL_CONFIG_DIR, 'tunnel-url.txt')
    writeFileSync(tunnelUrlFile, tunnelUrl)
    console.info(`🌐 Tunnel URL: ${tunnelUrl}`)

    // Run tunnel with config file
    const tunnelProcess = spawn(
      'cloudflared',
      ['tunnel', '--config', TUNNEL_CONFIG_FILE, 'run'],
      {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
      }
    )

    // Track if we've shown the connection message
    let hasShownConnected = false

    // Process stdout to filter logs
    tunnelProcess.stdout?.on('data', (data) => {
      const output = data.toString()

      // Only show first successful connection
      if (!hasShownConnected && output.includes('Registered tunnel connection')) {
        console.info('✅ Tunnel connected')
        hasShownConnected = true
      }
    })

    // Process stderr (where cloudflared logs go)
    tunnelProcess.stderr?.on('data', (data) => {
      const output = data.toString()

      // Only show first successful connection
      if (!hasShownConnected && output.includes('Registered tunnel connection')) {
        console.info('✅ Tunnel connected')
        hasShownConnected = true
      }
    })

    // handle process termination
    process.on('SIGINT', () => {
      tunnelProcess.kill()
      process.exit(0)
    })

    tunnelProcess.on('exit', (code) => {
      if (code !== 0) {
        console.warn(`⚠️  Tunnel process exited with code ${code}`)
      }
      // Keep process alive for watch mode
      new Promise(() => {})
    })
  } else {
    console.warn('⚠️  cloudflared not found - skipping tunnel setup')
    // Keep process alive for watch mode
    await new Promise(() => {})
  }
})
