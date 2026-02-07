#!/usr/bin/env bun

import { spawnSync } from 'node:child_process'

export function getEnvironment(resourceName: string) {
  if (!resourceName) {
    console.error(`No resouce name given:

      bun scripts/get-environment.ts [resourceName]
  `)
    process.exit(1)
  }

  console.info(`Getting environment for ${resourceName}...`)
  const result = spawnSync('bun', ['sst', 'state', 'export', '--stage', 'production'], {
    encoding: 'utf-8',
  })
  const state = JSON.parse(result.stdout || '{}')

  const resource = state.latest.resources.find(
    (x: any) => x.outputs?._dev?.title === resourceName
  )

  if (!resource) {
    console.error(`Can't find resource ${resourceName}`)
    process.exit(1)
  }

  return resource.outputs._dev.environment as Record<string, string>
}

if (import.meta.main) {
  const { cmd } = await import('./cmd')

  await cmd`get environment variables from SST production state`.run(async () => {
    console.info(getEnvironment(process.argv[2] || ''))
  })
}
