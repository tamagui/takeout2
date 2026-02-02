/**
 * Port conflict detection for Takeout services
 */

import { execSync } from 'node:child_process'

import type { PortCheck } from '../types'

function isPortInUse(port: number): { inUse: boolean; pid?: number } {
  try {
    if (process.platform === 'win32') {
      // windows: use netstat to find processes on the port
      const output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim()

      if (!output) return { inUse: false }

      // extract pid from last column of netstat output
      const lines = output.split('\n')
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        // check if this is a LISTENING state on the exact port
        if (parts[1]?.includes(`:${port}`) && parts[3] === 'LISTENING') {
          const pid = Number.parseInt(parts[4] || '', 10)
          return { inUse: true, pid: Number.isNaN(pid) ? undefined : pid }
        }
      }
      return { inUse: false }
    } else {
      // unix: use lsof
      const output = execSync(`lsof -i :${port} -t`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim()

      const pid = output ? Number.parseInt(output.split('\n')[0] || '', 10) : undefined

      return { inUse: !!output, pid: Number.isNaN(pid) ? undefined : pid }
    }
  } catch {
    // if command fails, port is likely free
    return { inUse: false }
  }
}

export const TAKEOUT_PORTS = {
  postgres: +(process.env.VITE_PORT_POSTGRES || 5433),
  zero: +(process.env.VITE_PORT_ZERO || 4848),
  web: +(process.env.VITE_PORT_WEB || 8081),
  minio: +(process.env.VITE_PORT_MINIO || 9200),
  minioConsole: +(process.env.VITE_PORT_MINIO_CONSOLE || 9201),
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
