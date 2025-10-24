#!/usr/bin/env bun

import { $ } from 'bun'
import { watch } from 'chokidar'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { run } from './helpers/run'

const watchFlag = process.argv.includes('--watch')
const appArgs = process.argv.slice(2).filter((arg) => arg !== '--watch')
const targetApp = appArgs[0]

const APPS_DIR = join(process.cwd(), 'src/apps')

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

function getAppDirectories(): string[] {
  const entries = readdirSync(APPS_DIR, { withFileTypes: true })
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
}

function getAppFromPath(filePath: string): string | null {
  // extract app name from path like src/apps/stripe/app.tsx
  const match = filePath.match(/src\/apps\/([^/]+)\//)
  return match ? match[1]! : null
}

async function buildApp(appName: string) {
  try {
    await run(`bun apps:build:one ${appName}`)
  } catch (error) {
    console.error(`❌ Failed to build app ${appName}: ${error}`)
  }
}

async function buildAllApps() {
  const appDirs = targetApp ? [targetApp] : getAppDirectories()
  if (appDirs.length === 0) {
    console.info('No app directories found')
    return
  }

  await Promise.all(
    appDirs.map(async (appName) => {
      await buildApp(appName)
    })
  )

  console.info('🎉 All apps built!')
}

if (watchFlag) {
  console.info(`👀 Watching src/apps${targetApp ? `/${targetApp}` : ''} for changes...`)

  // track individual app builds
  const appBuildQueues = new Map<string, ReturnType<typeof debounce>>()

  // separate debounced migrate that runs after any app builds
  const debouncedMigrate = debounce(async () => {
    console.info(`Migrating apps...`)
    await $`bun apps:migrate`
    console.info(`Migration done! ✅`)
  }, 500) // less debounce for migrate

  const handleFileChange = (filePath: string, action: string) => {
    console.info(`${action} File: ${filePath}`)

    const appName = getAppFromPath(filePath)
    if (!appName) {
      console.warn(`Could not determine app from path: ${filePath}`)
      return
    }

    // if we're watching a specific app, only rebuild that one
    if (targetApp && appName !== targetApp) {
      return
    }

    // get or create debounced build function for this app
    if (!appBuildQueues.has(appName)) {
      appBuildQueues.set(
        appName,
        debounce(async () => {
          await buildApp(appName)
          // trigger migrate after successful build
          debouncedMigrate()
        }, 2_000)
      )
    }

    const debouncedBuildApp = appBuildQueues.get(appName)!
    debouncedBuildApp()
  }

  const watchPaths = targetApp ? [`./src/apps/${targetApp}`] : ['./src/apps']

  const watcher = watch(watchPaths, {
    ignored: /(\.frontend\.tsx|\.backend\.tsx|\.app\.json$)/,
    ignoreInitial: true,
  })

  watcher.on('change', (filePath) => handleFileChange(filePath, '📝'))
  watcher.on('add', (filePath) => handleFileChange(filePath, '➕'))
} else {
  // run build once
  await buildAllApps()
}
