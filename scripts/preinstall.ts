#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Check node and bun versions before install`.run(async ({ fs, path }) => {
  const packageJson = JSON.parse(
    await fs.promises.readFile(path.join(import.meta.dir, '../package.json'), 'utf-8')
  )

  const errors: string[] = []

  // check bun version
  const packageManager = packageJson.packageManager as string | undefined
  if (packageManager?.startsWith('bun@')) {
    const requiredBun = packageManager.replace('bun@', '')
    const currentBun = Bun.version
    if (currentBun !== requiredBun) {
      errors.push(`bun: expected ${requiredBun}, got ${currentBun}`)
    }
  }

  // check node version
  const requiredNode = packageJson.engines?.node as string | undefined
  if (requiredNode) {
    const currentNode = process.version.replace('v', '')
    if (currentNode !== requiredNode) {
      errors.push(`node: expected ${requiredNode}, got ${currentNode}`)
    }
  }

  if (errors.length > 0) {
    console.error('\x1b[31m✗ version mismatch\x1b[0m')
    for (const error of errors) {
      console.error(`  ${error}`)
    }
    process.exit(1)
  }
})
