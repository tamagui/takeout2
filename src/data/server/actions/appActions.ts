import { runApp } from '~/features/apps/runApp'

async function migrateInitialApps() {
  const { migrateInitialApps } = await import('~/apps/migrateInitialApps')
  await migrateInitialApps()
}

export const appActions = {
  runApp,
  migrateInitialApps,
}
