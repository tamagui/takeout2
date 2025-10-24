import testFailJob from './testFailJob'
import testJob from './testJob'

export const jobDefinitions = [testFailJob, testJob] as const

export type JobName = (typeof jobDefinitions)[number]['name']
