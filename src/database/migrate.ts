import { migrate } from '@vxrn/postgres/migrate'
import { ZERO_CHANGE_DB, ZERO_CVR_DB, ZERO_UPSTREAM_DB } from '~/server/env-server'

const migrationsTS = import.meta.glob(`./migrations/*.ts`)

// vite tries to eval this at build time :/
const PROCESS_ENV = globalThis['process']['env']

export async function main() {
  await migrate({
    connectionString: ZERO_UPSTREAM_DB!,
    migrationsGlob: migrationsTS,
    cvrDb: ZERO_CVR_DB,
    changeDb: ZERO_CHANGE_DB,
    gitSha: process.env.GIT_SHA,
  })
}

if (PROCESS_ENV.RUN) {
  main().catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
}
