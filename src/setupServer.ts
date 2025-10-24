import { initializeZeroMigrations } from './data/server/initializeZeroMigrations'
import { initializeErrorHandling } from './features/errors/setupErrorHandling'
import { initializeLogger } from './features/logger/logger'

console.info(`[server] start (SHA: ${process.env.GIT_SHA})`)

initializeErrorHandling()
initializeLogger()
initializeZeroMigrations()
