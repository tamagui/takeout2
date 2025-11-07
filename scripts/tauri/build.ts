/**
 * @description Build Tauri desktop application
 */

import { $ } from 'bun'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { setupExitHandlers } from '~/helpers/process/setupExitHandlers'

// run from ./src/tauri
$.cwd(join(__dirname, '..'))

const isDev = !!process.env.DEV

// in dev mode we change the icon and the tauri config
let originalTauriConf: string | undefined
let hasRestoredConfig = false

function restoreOriginal() {
  if (isDev && originalTauriConf && !hasRestoredConfig) {
    try {
      const tauriConfPath = join(__dirname, '..', `tauri.conf.json`)
      writeFileSync(tauriConfPath, originalTauriConf)
      hasRestoredConfig = true
      console.info('Restored original tauri configuration')
    } catch (error) {
      console.error('Failed to restore original tauri configuration:', error)
    }
  }
}

const { exit } = setupExitHandlers({
  onExit: restoreOriginal,
  processName: 'Tauri build',
})

async function main() {
  try {
    const tauriConfPath = join(__dirname, '..', `tauri.conf.json`)
    originalTauriConf = readFileSync(tauriConfPath, 'utf-8')

    // Validate we're starting with production configuration
    const currentConfig = JSON.parse(originalTauriConf)
    if (!isDev && currentConfig.productName !== 'start.chat') {
      console.error(
        `ERROR: tauri.conf.json has incorrect productName: "${currentConfig.productName}"`
      )
      console.error('Expected "start.chat" for production builds.')
      console.error('Please fix tauri.conf.json before building.')
      exit(1)
    }

    if (isDev) {
      const parsed = JSON.parse(originalTauriConf)
      // Don't delete macOS bundle config as it may affect app capabilities
      // delete parsed.bundle.macOS
      parsed['productName'] = 'start.chat.dev'
      parsed.build['frontendDist'] = './shell-dev'
      parsed.plugins['deep-link'].desktop.schemes = ['start-chat-dev']

      writeFileSync(tauriConfPath, JSON.stringify(parsed, null, 2))
      console.info('Modified tauri.conf.json for dev build')
    }

    console.info(`build icons...`)
    await $`tauri icon ../../assets/${isDev ? 'icon-dev' : 'icon'}.png -o ./icons && rm -r icons/android icons/ios`

    console.info(`build sidecar...`)
    await $`bun ./scripts/build-sidecar.ts`

    if (process.env.PREBUILD) {
      exit(0)
    }

    if (process.env.TAMAGUI_DEBUG) {
      // For dev builds, clear any CI signing environment variables
      delete process.env.APPLE_CERTIFICATE
      delete process.env.APPLE_CERTIFICATE_PASSWORD
      delete process.env.APPLE_API_KEY_CONTENTS
      delete process.env.APPLE_API_KEY_PATH
      delete process.env.APPLE_API_KEY
      delete process.env.APPLE_API_ISSUER
    }

    console.info(`build tauri...`)
    if (isDev) {
      await $`tauri build --debug`
    } else {
      await $`tauri build --no-bundle`

      console.info(`bundle tauri...`)
      await $`tauri bundle --bundles app,dmg`
    }
  } finally {
    restoreOriginal()
  }
}

main().catch((error) => {
  console.error(error)
  exit(1)
})
