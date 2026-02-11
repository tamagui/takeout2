async function setup() {
  if (process.env.ONE_RENDER_MODE === 'ssg') {
    return
  } else {
    const { initializeZeroMigrations } =
      await import('./data/server/initializeZeroMigrations')
    const { initializeErrorHandling } =
      await import('./features/errors/setupErrorHandling')
    const { initializeLogger } = await import('./features/logger/logger')

    console.info(`[server] start (SHA: ${process.env.GIT_SHA})`)

    initializeErrorHandling()
    initializeLogger()
    initializeZeroMigrations()
  }
}

await setup()

export {}
