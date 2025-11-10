#!/usr/bin/env bun

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { handleProcessExit } from './helpers/handleProcessExit'
import { run } from './helpers/run'

handleProcessExit()

const TUNNEL_CONFIG_DIR = join(homedir(), '.onechat-tunnel')
const TUNNEL_ID_FILE = join(TUNNEL_CONFIG_DIR, 'tunnel-id.txt')

async function ensureCloudflared(): Promise<boolean> {
  try {
    // check if cloudflared is installed
    await run('cloudflared --version', { silent: true })
    return true
  } catch {
    // install cloudflared using npm
    try {
      await run('npm install -g cloudflared')
      return true
    } catch (error) {
      console.error('Error installing cloudflared:', error)
      return false
    }
  }
}

async function ensureAuthenticated(): Promise<boolean> {
  // check if we have credentials
  const certPath = join(homedir(), '.cloudflared', 'cert.pem')
  if (existsSync(certPath)) {
    return true
  }

  try {
    await run('cloudflared tunnel login')
    return true
  } catch {
    console.error('\n❌ Authentication failed')
    return false
  }
}

async function getOrCreateTunnel(): Promise<string | null> {
  // create config directory if it doesn't exist
  if (!existsSync(TUNNEL_CONFIG_DIR)) {
    mkdirSync(TUNNEL_CONFIG_DIR, { recursive: true })
  }

  // check if we have a saved tunnel ID
  if (existsSync(TUNNEL_ID_FILE)) {
    const tunnelId = readFileSync(TUNNEL_ID_FILE, 'utf-8').trim()
    return tunnelId
  }

  // create a new tunnel with a stable name
  const tunnelName = `onechat-dev-${process.env.USER || 'tunnel'}`

  try {
    const { stdout, stderr } = await run(`cloudflared tunnel create ${tunnelName}`, {
      captureOutput: true,
    })
    const output = stdout + stderr

    // extract tunnel ID from output - try multiple patterns
    const match1 = output.match(/Created tunnel .+ with id ([a-f0-9-]+)/i)
    const match2 = output.match(/Tunnel ([a-f0-9-]+) created/i)
    const match3 = output.match(
      /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i
    )

    const tunnelId = match1?.[1] || match2?.[1] || match3?.[1]

    if (tunnelId) {
      writeFileSync(TUNNEL_ID_FILE, tunnelId)
      return tunnelId
    }

    console.error('Failed to extract tunnel ID from output')
    console.error('Output was:', output)
    return null
  } catch (error: any) {
    // check if tunnel already exists
    if (error.message?.includes('already exists')) {
      try {
        const { stdout } = await run(
          `cloudflared tunnel list --name ${tunnelName} --output json`,
          { captureOutput: true }
        )
        const tunnels = JSON.parse(stdout)
        if (tunnels.length > 0) {
          const tunnelId = tunnels[0].id
          writeFileSync(TUNNEL_ID_FILE, tunnelId)
          return tunnelId
        }
      } catch (e) {
        console.error('Failed to parse tunnel list:', e)
      }
    } else {
      console.error('Failed to create tunnel:', error)
    }
    return null
  }
}

async function runTunnel(port: number = 8262) {
  // ensure cloudflared is installed
  const isInstalled = await ensureCloudflared()
  if (!isInstalled) {
    console.error('Failed to install cloudflared')
    process.exit(1)
  }

  // ensure authenticated
  const isAuthenticated = await ensureAuthenticated()
  if (!isAuthenticated) {
    console.error('Failed to authenticate with Cloudflare')
    process.exit(1)
  }

  // get or create tunnel
  const tunnelId = await getOrCreateTunnel()
  if (!tunnelId) {
    console.error('Failed to get or create tunnel')
    process.exit(1)
  }

  // save the expected URL immediately so it's available right away
  const expectedUrl = `https://${tunnelId}.cfargotunnel.com`
  writeFileSync(join(TUNNEL_CONFIG_DIR, 'tunnel-url.txt'), expectedUrl)
  console.info(`\n🌐 Tunnel URL: ${expectedUrl}`)

  // get the public URL in the background
  setTimeout(async () => {
    try {
      const { stdout } = await run(`cloudflared tunnel info ${tunnelId} --output json`, {
        captureOutput: true,
        silent: true,
      })

      try {
        const info = JSON.parse(stdout)
        const hostname = info.hostname || `${tunnelId}.cfargotunnel.com`
        writeFileSync(join(TUNNEL_CONFIG_DIR, 'tunnel-url.txt'), `https://${hostname}`)
      } catch (e) {
        // use fallback URL already saved
      }
    } catch (e) {
      // use fallback URL already saved
    }
  }, 3000)

  // run tunnel in detached mode so it keeps running and gets managed by handleProcessExit
  await run(`cloudflared tunnel run --url http://localhost:${port} ${tunnelId}`, {
    detached: false,
  })
}

// Parse command line arguments
const args = process.argv.slice(2)
let port = 8262

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    const portArg = args[i + 1]
    if (portArg) {
      const parsedPort = parseInt(portArg, 10)
      if (!Number.isNaN(parsedPort)) {
        port = parsedPort
      }
    }
  }
}

runTunnel(port)
