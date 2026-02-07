#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`npm postinstall tasks`.run(async ({ $, fs }) => {
  // "tko" wont work until this runs so referencing it directly:
  const buildInitialLocation = require.resolve('@take-out/scripts/build-initial')
  await $`bun run ${buildInitialLocation}`

  // sync zero version from dependencies to env config
  // this ensures the deployed Zero server always matches the client version
  const packageJsonPath = 'package.json'
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
  const zeroVersion = packageJson.dependencies?.['@rocicorp/zero']

  if (zeroVersion && packageJson.env?.ZERO_VERSION !== zeroVersion) {
    console.info(
      `Syncing ZERO_VERSION: ${packageJson.env?.ZERO_VERSION || '(empty)'} → ${zeroVersion}`
    )
    packageJson.env.ZERO_VERSION = zeroVersion
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8')

    // update docker-compose fallback versions
    const dockerComposePaths = ['docker-compose.yml', 'src/uncloud/docker-compose.yml']
    for (const dockerComposePath of dockerComposePaths) {
      const dockerCompose = await fs.readFile(dockerComposePath, 'utf-8')
      const updatedDockerCompose = dockerCompose.replace(
        /image: "rocicorp\/zero:\$\{ZERO_VERSION:-[^}]*\}"/,
        `image: "rocicorp/zero:\${ZERO_VERSION:-${zeroVersion}}"`
      )
      if (updatedDockerCompose !== dockerCompose) {
        await fs.writeFile(dockerComposePath, updatedDockerCompose, 'utf-8')
        console.info(`Updated ${dockerComposePath} fallback to ${zeroVersion}`)
      }
    }

    // run env:update to propagate to ci.yml, env-server.ts, etc
    await $`bun tko run env-update`
  }

  await Promise.all([
    //
    $`bun tko run update-local-env`,
    $`bun run one patch`,
    // regenerate claude code skills from docs (skills dir is gitignored)
    $`bun tko docs skills`,
  ])
})
