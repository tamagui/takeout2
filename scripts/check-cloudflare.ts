import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'

const worker = spawn(
  'bunx',
  [
    'wrangler',
    'dev',
    '--local',
    '--config',
    'dist/worker/wrangler.json',
    '--ip',
    '127.0.0.1',
    '--port',
    '0',
    '--var',
    'BETTER_AUTH_SECRET:local-auth-probe-secret',
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] },
)

let output = ''
const ready = new Promise<string>((resolve, reject) => {
  worker.on('error', reject)
  worker.on('exit', (code) => reject(new Error(`worker exited ${code}\n${output}`)))
  const read = (chunk: Buffer) => {
    output += chunk.toString()
    const match = output.match(/Ready on (http:\/\/127\.0\.0\.1:\d+)/)
    if (match) resolve(match[1])
  }
  worker.stdout.on('data', read)
  worker.stderr.on('data', read)
})

try {
  const origin = await ready
  const response = await fetch(`${origin}/api/auth/get-session`)
  const body = await response.text()
  assert.equal(response.status, 200, body)
  assert.equal(JSON.parse(body), null)
  console.info('prepared Cloudflare worker auth endpoint passed')
} finally {
  if (worker.exitCode === null) {
    const exited = once(worker, 'exit')
    worker.kill('SIGTERM')
    await exited
  }
}
