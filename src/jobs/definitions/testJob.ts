import { createJob } from '../createJob'

type TestJobPayload = {
  message?: string
  duration?: number
}

export default createJob<TestJobPayload>({
  name: 'test-job',
  handler: async ({ payload, log, updateProgress }) => {
    const message = payload.message || 'test job executed successfully'
    const duration = payload.duration || 2000

    log(`starting test job with message: ${message}`)

    await updateProgress(25)
    await new Promise((resolve) => setTimeout(resolve, duration / 4))
    log('25% complete')

    await updateProgress(50)
    await new Promise((resolve) => setTimeout(resolve, duration / 4))
    log('50% complete')

    await updateProgress(75)
    await new Promise((resolve) => setTimeout(resolve, duration / 4))
    log('75% complete')

    await updateProgress(100)
    await new Promise((resolve) => setTimeout(resolve, duration / 4))
    log('100% complete')

    return {
      success: true,
      message,
      processedAt: new Date().toISOString(),
    }
  },
})
