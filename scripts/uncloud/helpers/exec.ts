import { execSync } from 'node:child_process'

export function exec(
  command: string,
  options?: { silent?: boolean; cwd?: string }
): string {
  const { silent = false, cwd = process.cwd() } = options || {}

  if (!silent) {
    console.info(`\n🔧 ${command}`)
  }

  try {
    return execSync(command, {
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
      cwd,
    })
  } catch (error) {
    if (!silent) {
      console.error(`❌ Command failed: ${command}`)
    }
    throw error
  }
}
