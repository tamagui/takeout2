import { startJobRunner } from './runner'

export { createJob } from './createJob'
export { jobDefinitions } from './definitions'
export type * from './types'

if (require.main === module) {
  startJobRunner().catch((error) => {
    console.error('fatal error in job runner:', error)
    process.exit(1)
  })
}
