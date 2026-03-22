import { run } from '@take-out/scripts/helpers/run'

export async function buildMigrations(): Promise<void> {
  console.info('\n🔧 building migrations...\n')
  await run('bun tko db build')
  console.info('✅ migrations built')
}

export async function buildWeb(): Promise<void> {
  console.info('\n📦 building web app...\n')
  await run('bun run web build')
  console.info('✅ web build complete')
}

export async function buildDockerImage(
  imageName = 'takeout-web:latest',
  platform = process.env.DEPLOYMENT_ARCH || 'linux/amd64',
): Promise<void> {
  console.info('\n🐳 building docker image...\n')
  console.info(`platform: ${platform}`)
  await run(`docker build --platform ${platform} -t ${imageName} .`)
  console.info('✅ docker image built')
}

export async function checkDist(): Promise<boolean> {
  try {
    await run('test -d dist', { silent: true })
    console.info('✅ dist/ directory exists')
    return true
  } catch {
    return false
  }
}
