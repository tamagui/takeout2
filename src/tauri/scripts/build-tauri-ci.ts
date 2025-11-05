#!/usr/bin/env bun

import { $ } from 'bun'
import { writeFileSync } from 'node:fs'
import { setupExitHandlers } from '~/helpers/process/setupExitHandlers'

console.info('Starting Tauri CI build process...')

async function setupAppleCertificates() {
  // Set up Apple certificate for code signing if available
  if (process.env.APPLE_CERTIFICATE && process.env.APPLE_CERTIFICATE_PASSWORD) {
    console.info('Setting up Apple certificate for code signing...')

    // Decode base64 certificate
    const certPath = '/tmp/apple-cert.p12'
    const certBase64 = process.env.APPLE_CERTIFICATE
    await $`echo "${certBase64}" | base64 -d > ${certPath}`

    // Create temporary keychain
    const keychainName = 'tauri-build.keychain'
    const keychainPassword = 'temporary-password'

    await $`security create-keychain -p "${keychainPassword}" ${keychainName}`
    await $`security default-keychain -s ${keychainName}`
    await $`security unlock-keychain -p "${keychainPassword}" ${keychainName}`

    // Import certificate
    await $`security import ${certPath} -k ${keychainName} -P "${process.env.APPLE_CERTIFICATE_PASSWORD}" -T /usr/bin/codesign -T /usr/bin/productsign`
    await $`security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "${keychainPassword}" ${keychainName}`

    // Clean up certificate file
    await $`rm -f ${certPath}`
  }

  // Set up Apple API key for notarization if available
  if (process.env.APPLE_API_KEY_CONTENTS) {
    console.info('Setting up Apple API key for notarization...')

    // Write API key contents to a temporary file
    const apiKeyPath = '/tmp/apple-api-key.p8'
    writeFileSync(apiKeyPath, process.env.APPLE_API_KEY_CONTENTS)

    // Set the environment variable that Tauri expects
    process.env.APPLE_API_KEY_PATH = apiKeyPath

    console.info(`Apple API key written to: ${apiKeyPath}`)
  }
}

async function cleanupAppleFiles() {
  if (process.env.APPLE_API_KEY_CONTENTS) {
    await $`rm -f /tmp/apple-api-key.p8`.quiet()
  }
}

const { exit } = setupExitHandlers({
  onExit: cleanupAppleFiles,
  processName: 'Tauri CI build',
})

async function main() {
  try {
    // Validate tauri.conf.json is in production mode
    const tauriConfigPath = './src/tauri/tauri.conf.json'
    const tauriConfig = JSON.parse(await $`cat ${tauriConfigPath}`.text())

    if (tauriConfig.productName !== 'start.chat') {
      throw new Error(
        `Invalid productName in tauri.conf.json: ${tauriConfig.productName}. Expected 'start.chat' for production build.`
      )
    }

    if (tauriConfig.build.frontendDist !== './shell-prod') {
      throw new Error(
        `Invalid frontendDist in tauri.conf.json: ${tauriConfig.build.frontendDist}. Expected './shell-prod' for production build.`
      )
    }

    console.info('✅ Tauri configuration validated for production build')

    // Generate hash file BEFORE version bump
    // IMPORTANT: This must happen before auto-bump-version.ts modifies files
    // The hash represents the source code state that triggered the build
    // This ensures the next CI check will correctly detect if source code changed
    console.info('\nGenerating Tauri hash for current source state...')
    await $`bun ./src/tauri/scripts/check-tauri-changed.ts --update`

    // Auto bump minor version
    console.info('Auto-bumping Tauri version...')
    await $`bun ./src/tauri/scripts/auto-bump-version.ts`

    // Set up Apple certificates
    await setupAppleCertificates()

    // Build the production Tauri app
    console.info('\nBuilding Tauri app...')
    await $`bun tko tauri build:prod`

    // Upload to R2 storage (DMG and hash file)
    console.info('\nUploading to R2 storage...')
    await $`bun tko tauri upload-release`

    // Generate and upload the update manifest
    console.info('\nGenerating update manifest...')
    await $`bun run:dev ./src/tauri/scripts/generate-tauri-manifest.ts`

    console.info('\n✅ Tauri build completed successfully!')
    console.info(
      'The hash file has been uploaded and will be used for future build checks.'
    )
  } catch (error) {
    console.error('\n❌ Tauri build failed:', error)
    throw error
  } finally {
    // Clean up Apple API key
    await cleanupAppleFiles()
  }
}

main().catch((error) => {
  exit(1)
})
