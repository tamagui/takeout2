#!/usr/bin/env bun

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

import { cmd } from './cmd'

function getCurrentNodeVersion() {
  // under bun, process.version is bun's bundled node-COMPAT string (a fixed
  // value like v24.3.0), not the project's actual node toolchain — comparing
  // it against engines.node rejects any pin newer than bun's compat level.
  // the check exists to guard native-addon ABI for the real `node` binary
  // child processes will run, so resolve that binary's version from PATH.
  if (process.versions.bun) {
    try {
      return execFileSync('node', ['--version'], { encoding: 'utf-8' }).trim()
    } catch {
      // no node on PATH — nothing for the version pin to guard
      return null
    }
  }
  return process.version
}

async function getRequiredNodeVersion() {
  const path = await import('node:path')

  // try .node-version file first
  try {
    const nodeVersionContent = await fs.promises.readFile(
      path.join(process.cwd(), '.node-version'),
      'utf-8',
    )
    return `v${nodeVersionContent.trim()}`
  } catch {}

  // fallback to package.json engines.node
  try {
    const packageJson = JSON.parse(
      await fs.promises.readFile(path.join(process.cwd(), 'package.json'), 'utf-8'),
    )
    return packageJson?.engines?.node ? `v${packageJson.engines.node}` : null
  } catch {
    return null
  }
}

export async function checkNodeVersion() {
  const currentNodeVersion = getCurrentNodeVersion()
  const requiredNodeVersion = await getRequiredNodeVersion()

  if (requiredNodeVersion && currentNodeVersion) {
    if (currentNodeVersion !== requiredNodeVersion) {
      throw new Error(
        `\u001b[33mWarning: Incorrect Node.js version. Expected ${requiredNodeVersion} but got ${currentNodeVersion}\u001b[0m`,
      )
    }
  }
}

if (import.meta.main) {
  await cmd`verify node version matches project requirements`.run(async () => {
    checkNodeVersion().catch((e: unknown) => {
      console.error((e as Error).message)
      process.exit(1)
    })
  })
}
