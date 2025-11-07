import { exec } from './exec'

export function buildMigrations() {
  console.info('\n🔧 building migrations...\n')
  exec('bun tko migrate build')
  console.info('✅ migrations built')
}

export function buildWeb() {
  console.info('\n📦 building web app...\n')
  exec('bun run web build')
  console.info('✅ web build complete')
}

export function buildDockerImage(
  imageName = 'takeout-web:latest',
  platform = 'linux/amd64'
) {
  console.info('\n🐳 building docker image...\n')
  console.info(`platform: ${platform}`)
  exec(`docker build --platform ${platform} -t ${imageName} .`)
  console.info('✅ docker image built')
}

export function checkDist() {
  try {
    exec('test -d dist', { silent: true })
    console.info('✅ dist/ directory exists')
    return true
  } catch {
    return false
  }
}
