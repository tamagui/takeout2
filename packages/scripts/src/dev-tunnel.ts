#!/usr/bin/env bun

import fs from 'node:fs'

import { cmd } from './cmd'

await cmd`set up cloudflare dev tunnel for local development`
  .args('--port number')
  .run(async ({ args, run, os, path }) => {
    const { handleProcessExit } = await import('./helpers/handleProcessExit')

    handleProcessExit()

    const TUNNEL_CONFIG_DIR = path.join(os.homedir(), '.onechat-tunnel')
    const TUNNEL_ID_FILE = path.join(TUNNEL_CONFIG_DIR, 'tunnel-id.txt')

    async function ensureCloudflared(): Promise<boolean> {
      try {
        await run('cloudflared --version', { silent: true })
        return true
      } catch {
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
      const certPath = path.join(os.homedir(), '.cloudflared', 'cert.pem')
      if (fs.existsSync(certPath)) {
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
      if (!fs.existsSync(TUNNEL_CONFIG_DIR)) {
        fs.mkdirSync(TUNNEL_CONFIG_DIR, { recursive: true })
      }

      if (fs.existsSync(TUNNEL_ID_FILE)) {
        const tunnelId = fs.readFileSync(TUNNEL_ID_FILE, 'utf-8').trim()
        return tunnelId
      }

      const tunnelName = `onechat-dev-${process.env.USER || 'tunnel'}`

      try {
        const { stdout, stderr } = await run(`cloudflared tunnel create ${tunnelName}`, {
          captureOutput: true,
        })
        const output = stdout + stderr

        const match1 = output.match(/Created tunnel .+ with id ([a-f0-9-]+)/i)
        const match2 = output.match(/Tunnel ([a-f0-9-]+) created/i)
        const match3 = output.match(
          /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i
        )

        const tunnelId = match1?.[1] || match2?.[1] || match3?.[1]

        if (tunnelId) {
          fs.writeFileSync(TUNNEL_ID_FILE, tunnelId)
          return tunnelId
        }

        console.error('Failed to extract tunnel ID from output')
        console.error('Output was:', output)
        return null
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          try {
            const { stdout } = await run(
              `cloudflared tunnel list --name ${tunnelName} --output json`,
              { captureOutput: true }
            )
            const tunnels = JSON.parse(stdout)
            if (tunnels.length > 0) {
              const tunnelId = tunnels[0].id
              fs.writeFileSync(TUNNEL_ID_FILE, tunnelId)
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

    const port = args.port ?? 8081

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

    // save the expected url immediately so it's available right away
    const expectedUrl = `https://${tunnelId}.cfargotunnel.com`
    fs.writeFileSync(path.join(TUNNEL_CONFIG_DIR, 'tunnel-url.txt'), expectedUrl)
    console.info(`\n🌐 Tunnel URL: ${expectedUrl}`)

    // get the public url in the background
    setTimeout(async () => {
      try {
        const { stdout } = await run(
          `cloudflared tunnel info ${tunnelId} --output json`,
          {
            captureOutput: true,
            silent: true,
          }
        )

        try {
          const info = JSON.parse(stdout)
          const hostname = info.hostname || `${tunnelId}.cfargotunnel.com`
          fs.writeFileSync(
            path.join(TUNNEL_CONFIG_DIR, 'tunnel-url.txt'),
            `https://${hostname}`
          )
        } catch (e) {
          // use fallback url already saved
        }
      } catch (e) {
        // use fallback url already saved
      }
    }, 3000)

    // run tunnel - managed by handleProcessExit
    await run(`cloudflared tunnel run --url http://localhost:${port} ${tunnelId}`, {
      detached: false,
    })
  })
