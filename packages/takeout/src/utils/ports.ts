/**
 * Port conflict detection for Takeout services
 */

import { execSync } from 'node:child_process'

import type { PortCheck } from '../types'

function isPortInUse(port: number): { inUse: boolean; pid?: number } {
  try {
    // Try to find what's using the port
    const output = execSync(`lsof -i :${port} -t`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim()

    const pid = output ? Number.parseInt(output.split('\n')[0] || '8081', 10) : undefined

    return { inUse: !!output, pid }
  } catch {
    // If lsof fails, port is likely free
    return { inUse: false }
  }
}

export const TAKEOUT_PORTS = {
  postgres: 5432,
  zero: 4848,
  web: 8081,
  minio: 9090,
  minioConsole: 9091,
} as const

export function checkPort(port: number, name: string): PortCheck {
  const { inUse, pid } = isPortInUse(port)
  return { port, name, inUse, pid }
}

export function checkAllPorts(): PortCheck[] {
  return [
    checkPort(TAKEOUT_PORTS.postgres, 'PostgreSQL'),
    checkPort(TAKEOUT_PORTS.zero, 'Zero Sync'),
    checkPort(TAKEOUT_PORTS.web, 'Web Server'),
    checkPort(TAKEOUT_PORTS.minio, 'MinIO (S3)'),
    checkPort(TAKEOUT_PORTS.minioConsole, 'MinIO Console'),
  ]
}

export function hasPortConflicts(checks: PortCheck[]): boolean {
  return checks.some((c) => c.inUse)
}

export function getConflictingPorts(checks: PortCheck[]): PortCheck[] {
  return checks.filter((c) => c.inUse)
}
