#!/usr/bin/env bun

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const TUNNEL_CONFIG_DIR = join(homedir(), '.onechat-tunnel')
const TUNNEL_ID_FILE = join(TUNNEL_CONFIG_DIR, 'tunnel-id.txt')

async function ensureCloudflared(): Promise<boolean> {
  try {
    // Check if cloudflared is installed
    const checkProcess = spawn('cloudflared', ['--version'], { shell: true })

    return new Promise((resolve) => {
      checkProcess.on('error', () => {
        // Install cloudflared using npm
        const installProcess = spawn('npm', ['install', '-g', 'cloudflared'], {
          stdio: 'inherit',
          shell: true,
        })

        installProcess.on('exit', (code) => {
          resolve(code === 0)
        })
      })

      checkProcess.on('exit', (code) => {
        if (code === 0) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  } catch (error) {
    console.error('Error checking cloudflared:', error)
    return false
  }
}

async function ensureAuthenticated(): Promise<boolean> {
  // Check if we have credentials
  const certPath = join(homedir(), '.cloudflared', 'cert.pem')
  if (existsSync(certPath)) {
    return true
  }

  return new Promise((resolve) => {
    const loginProcess = spawn('cloudflared', ['tunnel', 'login'], {
      stdio: 'inherit',
      shell: true,
    })

    loginProcess.on('exit', (code) => {
      if (code === 0) {
        resolve(true)
      } else {
        console.error('\n❌ Authentication failed')
        resolve(false)
      }
    })
  })
}

async function getOrCreateTunnel(): Promise<string | null> {
  // Create config directory if it doesn't exist
  if (!existsSync(TUNNEL_CONFIG_DIR)) {
    mkdirSync(TUNNEL_CONFIG_DIR, { recursive: true })
  }

  // Check if we have a saved tunnel ID
  if (existsSync(TUNNEL_ID_FILE)) {
    const tunnelId = readFileSync(TUNNEL_ID_FILE, 'utf-8').trim()
    return tunnelId
  }

  // Create a new tunnel with a stable name
  const tunnelName = `onechat-dev-${process.env.USER || 'tunnel'}`

  return new Promise((resolve) => {
    const createProcess = spawn('cloudflared', ['tunnel', 'create', tunnelName], {
      stdio: 'pipe',
      shell: true,
    })

    let output = ''
    createProcess.stdout.on('data', (data) => {
      output += data.toString()
    })

    createProcess.stderr.on('data', (data) => {
      output += data.toString()
    })

    createProcess.on('exit', (code) => {
      if (code === 0) {
        // Extract tunnel ID from output - try multiple patterns
        let tunnelId = null

        // Pattern 1: "Created tunnel onechat-dev-n8 with id <UUID>"
        const match1 = output.match(/Created tunnel .+ with id ([a-f0-9-]+)/i)
        // Pattern 2: "Tunnel <UUID> created"
        const match2 = output.match(/Tunnel ([a-f0-9-]+) created/i)
        // Pattern 3: Just look for a UUID pattern
        const match3 = output.match(
          /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i
        )

        tunnelId = match1?.[1] || match2?.[1] || match3?.[1]

        if (tunnelId) {
          writeFileSync(TUNNEL_ID_FILE, tunnelId)
          resolve(tunnelId)
        } else {
          console.error('Failed to extract tunnel ID from output')
          console.error('Output was:', output)
          resolve(null)
        }
      } else {
        // Check if tunnel already exists
        if (output.includes('already exists')) {
          // Try to get the tunnel ID from cloudflared list
          const listProcess = spawn(
            'cloudflared',
            ['tunnel', 'list', '--name', tunnelName, '--output', 'json'],
            { stdio: 'pipe', shell: true }
          )

          let listOutput = ''
          listProcess.stdout.on('data', (data) => {
            listOutput += data.toString()
          })

          listProcess.on('exit', () => {
            try {
              const tunnels = JSON.parse(listOutput)
              if (tunnels.length > 0) {
                const tunnelId = tunnels[0].id
                writeFileSync(TUNNEL_ID_FILE, tunnelId)
                resolve(tunnelId)
              } else {
                resolve(null)
              }
            } catch (e) {
              console.error('Failed to parse tunnel list:', e)
              resolve(null)
            }
          })
        } else {
          console.error('Failed to create tunnel:', output)
          resolve(null)
        }
      }
    })
  })
}

async function runTunnel(port: number = 8081) {
  // Ensure cloudflared is installed
  const isInstalled = await ensureCloudflared()
  if (!isInstalled) {
    console.error('Failed to install cloudflared')
    process.exit(1)
  }

  // Ensure authenticated
  const isAuthenticated = await ensureAuthenticated()
  if (!isAuthenticated) {
    console.error('Failed to authenticate with Cloudflare')
    process.exit(1)
  }

  // Get or create tunnel
  const tunnelId = await getOrCreateTunnel()
  if (!tunnelId) {
    console.error('Failed to get or create tunnel')
    process.exit(1)
  }
  const tunnelProcess = spawn(
    'cloudflared',
    ['tunnel', 'run', '--url', `http://localhost:${port}`, tunnelId],
    { stdio: 'inherit', shell: true }
  )

  // Save the expected URL immediately so it's available right away
  const expectedUrl = `https://${tunnelId}.cfargotunnel.com`
  writeFileSync(join(TUNNEL_CONFIG_DIR, 'tunnel-url.txt'), expectedUrl)
  console.info(`\n🌐 Tunnel URL: ${expectedUrl}`)

  // Get the public URL
  setTimeout(async () => {
    try {
      const infoProcess = spawn(
        'cloudflared',
        ['tunnel', 'info', tunnelId, '--output', 'json'],
        { stdio: 'pipe', shell: true }
      )

      let infoOutput = ''
      infoProcess.stdout.on('data', (data) => {
        infoOutput += data.toString()
      })

      infoProcess.on('exit', () => {
        try {
          const info = JSON.parse(infoOutput)
          const hostname = info.hostname || `${tunnelId}.cfargotunnel.com`

          // Save the URL for other scripts to use
          writeFileSync(join(TUNNEL_CONFIG_DIR, 'tunnel-url.txt'), `https://${hostname}`)
        } catch (e) {
          const fallbackUrl = `https://${tunnelId}.cfargotunnel.com`

          // Save the fallback URL
          writeFileSync(join(TUNNEL_CONFIG_DIR, 'tunnel-url.txt'), fallbackUrl)
        }
      })
    } catch (e) {
      console.error('Error getting tunnel info:', e)
    }
  }, 3000)

  // Handle shutdown
  process.on('SIGINT', () => {
    tunnelProcess.kill()
    process.exit(0)
  })

  tunnelProcess.on('exit', (code) => {
    process.exit(code || 0)
  })
}

// Parse command line arguments
const args = process.argv.slice(2)
let port = 8081

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
