import type {
  HumanReadable,
  Query,
  RunOptions,
  Schema as ZeroSchema,
} from '@rocicorp/zero'

export type { RunOptions }

export type ZeroRunner = <TReturn>(
  query: Query<any, ZeroSchema, TReturn>,
  options?: RunOptions
) => Promise<HumanReadable<TReturn>>

let runner: ZeroRunner | null = null

export function setRunner(r: ZeroRunner) {
  runner = r
}

export function getRunner(): ZeroRunner {
  if (!runner) {
    throw new Error(
      'Zero runner not initialized. Ensure ProvideZero is mounted (client) or createZeroServer is called (server).'
    )
  }
  return runner
}
