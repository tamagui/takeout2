import { createJob } from '../createJob'

type TestFailJobPayload = {
  errorMessage?: string
  failAtProgress?: number
}

export default createJob<TestFailJobPayload>({
  name: 'test-fail-job',
  handler: async ({ payload, log, updateProgress }) => {
    const errorMessage = payload.errorMessage || 'intentional test failure'
    const failAtProgress = payload.failAtProgress || 50

    log('starting test fail job')

    if (failAtProgress > 0) {
      await updateProgress(Math.min(25, failAtProgress - 1))
      log('25% complete')
    }

    if (failAtProgress > 25) {
      await updateProgress(Math.min(50, failAtProgress - 1))
      log('50% complete - about to fail')
    }

    if (failAtProgress <= 50) {
      log(`failing with error: ${errorMessage}`)
      throw new Error(errorMessage)
    }

    await updateProgress(75)
    log('75% complete')

    await updateProgress(100)
    log('100% complete')

    return {
      success: true,
    }
  },
})
