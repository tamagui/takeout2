import { startZeroLite } from '@take-out/zero-lite'

const { stop } = await startZeroLite()

process.on('SIGINT', async () => {
  await stop()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await stop()
  process.exit(0)
})
