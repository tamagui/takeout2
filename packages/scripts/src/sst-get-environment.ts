#!/usr/bin/env bun

export function getEnvironment(resourceName: string) {
  if (!resourceName) {
    console.error(`No resouce name given:
      
      bun scripts/get-environment.ts [resourceName]
  `)
    process.exit(1)
  }

  console.info(`Getting environment for ${resourceName}...`)
  const state = JSON.parse(
    Bun.spawnSync(`bun sst state export --stage production`.split(' ')).stdout.toString()
  )

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
  console.info(getEnvironment(process.argv[2] || ''))
}
