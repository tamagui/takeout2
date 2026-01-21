---
name: takeout-cloudflare-dev-tunnel
description: Cloudflare dev tunnel guide for exposing local development servers publicly. dev tunnel, cloudflare tunnel, cfargotunnel, local tunnel, testing webhooks, webhook testing, share local server, expose localhost, ngrok alternative.
---

# Development Tunnel

The dev tunnel feature provides a stable public URL for your local development
server, perfect for testing webhooks and sharing your dev environment with team
members.

## Features

Each developer gets their own persistent tunnel URL using Cloudflare Tunnel
(cloudflared) installed via npm. Single command to start. Webhooks automatically
use the tunnel URL when available.

## Setup

Run `bun install`, then run `bun dev:tunnel` once to set up cloudflare. After
that you can just run your dev server as normal with `bun dev`.

## How it Works

The tunnel creates a stable subdomain on `cfargotunnel.com`. Your tunnel URL is
saved and reused across sessions. Webhooks automatically detect and use the
tunnel URL. The tunnel persists until you stop it with Ctrl+C.

## Usage with Webhooks

When the tunnel is running, webhook URLs will automatically use your public
tunnel URL instead of localhost.

Without tunnel: `http://localhost:8081/api/webhook/...` With tunnel:
`https://your-tunnel-id.cfargotunnel.com/api/webhook/...`

## Troubleshooting

If you get permission errors, the script will try to install cloudflared
automatically. Your tunnel configuration is stored in `~/.onechat-tunnel/`. To
reset your tunnel, delete `~/.onechat-tunnel/tunnel-id.txt`.
