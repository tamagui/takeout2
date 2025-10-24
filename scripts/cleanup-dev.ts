#!/usr/bin/env bun

import { $ } from 'bun'
import { platform } from 'node:os'

// only run on macOS
if (platform() === 'darwin') {
  try {
    const result = await $`ps aux | grep -i "Onejs:dev" | grep -v grep`.quiet()
    if (result.stdout.toString().trim() === '') {
      process.exit(0)
    }

    const processes = result.stdout.toString().trim().split('\n')

    for (const process of processes) {
      const parts = process.trim().split(/\s+/)
      const pid = parts[1]
      const command = parts.slice(10).join(' ')

      console.info(`  PID: ${pid} - ${command}`)

      // Check if process is related to ~/chat directory
      if (command.includes('chat')) {
        try {
          await $`kill -9 ${pid}`
          console.info(`✅ Killed hanging one process ${pid}`)
        } catch (error) {
          console.info(`❌ Failed to kill hanging one process ${pid}: ${error}`)
        }
      }
    }
  } catch (error: any) {
    // if grep returns 1, it means no process was found, which is fine
  }
}
