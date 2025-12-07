/**
 * Sync utilities for updating docs and scripts between repositories
 */

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'

import { confirm } from '@clack/prompts'
import pc from 'picocolors'

export interface FileToSync {
  name: string
  sourcePath: string
  targetPath: string
  status: 'new' | 'modified' | 'identical'
  sourceSize?: number
  targetSize?: number
}

export function getFileHash(filePath: string): string {
  const content = readFileSync(filePath)
  return createHash('md5').update(content).digest('hex')
}

export function compareFiles(
  sourcePath: string,
  targetPath: string
): 'new' | 'modified' | 'identical' {
  if (!existsSync(targetPath)) {
    return 'new'
  }

  const sourceHash = getFileHash(sourcePath)
  const targetHash = getFileHash(targetPath)

  return sourceHash === targetHash ? 'identical' : 'modified'
}

export async function syncFileWithConfirmation(file: FileToSync): Promise<boolean> {
  const relPath = relative(process.cwd(), file.targetPath)

  if (file.status === 'identical') {
    console.info(pc.dim(`  ✓ ${file.name} (already up to date)`))
    return false
  }

  const statusColor = file.status === 'new' ? pc.green : pc.yellow
  const statusText = file.status === 'new' ? 'NEW' : 'MODIFIED'

  console.info()
  console.info(statusColor(`  ${statusText}: ${file.name}`))

  if (file.status === 'modified') {
    const sourceSize = file.sourceSize || 0
    const targetSize = file.targetSize || 0
    const diff = sourceSize - targetSize

    console.info(pc.dim(`    Source: ${sourceSize} bytes`))
    console.info(pc.dim(`    Target: ${targetSize} bytes`))

    if (diff > 0) {
      console.info(pc.cyan(`    Source is ${diff} bytes larger`))
    } else if (diff < 0) {
      console.info(pc.magenta(`    Target is ${Math.abs(diff)} bytes larger`))
    }
  }

  console.info(pc.dim(`    → ${relPath}`))

  const shouldSync = await confirm({
    message: `Overwrite this file?`,
    initialValue: true,
  })

  if (shouldSync === false || typeof shouldSync === 'symbol') {
    console.info(pc.dim(`  ⊘ Skipped`))
    return false
  }

  // ensure target directory exists
  const targetDir = dirname(file.targetPath)
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true })
  }

  // copy file
  const content = readFileSync(file.sourcePath)
  writeFileSync(file.targetPath, content)

  console.info(pc.green(`  ✓ Synced`))
  return true
}

export function getFileSize(filePath: string): number {
  try {
    return statSync(filePath).size
  } catch {
    return 0
  }
}
