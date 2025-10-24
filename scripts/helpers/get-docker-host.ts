#!/usr/bin/env bun

import { execSync } from 'node:child_process'
import { platform } from 'node:os'

/**
 * Gets the appropriate host address for Docker containers to connect back to the host machine
 * - On macOS/Windows: host.docker.internal works out of the box
 * - On Linux: We need to get the actual host IP from the docker bridge network
 */
export function getDockerHost(): string {
  // In CI or on Linux, we need the actual host IP
  if (platform() === 'linux') {
    try {
      // Get the host IP from docker network
      const result = execSync(
        "docker network inspect bridge --format '{{range .IPAM.Config}}{{.Gateway}}{{end}}'",
        { encoding: 'utf-8' }
      ).trim()

      if (result) {
        console.info(`Using Docker bridge gateway IP: ${result}`)
        return result
      }
    } catch (error) {
      console.warn('Failed to get Docker bridge IP, falling back to host.docker.internal')
    }
  }

  // Default for macOS/Windows or fallback
  return 'host.docker.internal'
}

// If run directly, output the host
if (import.meta.main) {
  console.info(getDockerHost())
}
