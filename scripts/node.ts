#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Start interactive Node REPL with SST resources`.run(async () => {
  await import('@take-out/scripts/ensure-tunnel')

  const { Resource } = await import('sst')

  // this isn't working really at least to fetch urls i'm trying like http://WebApp.production.start-dot-chat.sst

  console.warn(`Resources:`, Resource)

  const LOCALHOST = `http://localhost`

  console.info(`LOCALHOST set to: ${LOCALHOST}`)
  console.info(`Example: fetchAndLogJSON(\`${LOCALHOST}:8108/health\`)`)

  const nodeCommand = `
global.LOCALHOST = '${LOCALHOST}';
global.fetchAndLogJSON = (...args) => {
  fetch(...args).then(res => res.json()).then(_ => console.log(_)).catch(err => console.error('error', err))
};
// Start REPL
require('repl').start({
  prompt: 'sst> ',
  useGlobal: true,
  ignoreUndefined: true
});
`

  const { exitCode } = Bun.spawnSync(['node', '-e', nodeCommand], {
    stdin: 'ignore',
    stdout: 'inherit',
    stderr: 'inherit',
    env: {
      ...process.env,
    },
  })

  process.exit(exitCode)
})
