import { args as parseArgs, type Args } from './helpers/args'
import { run } from './helpers/run'

type Prettify<T> = { [K in keyof T]: T[K] } & {}

type CmdContext = {
  $: typeof import('bun').$
  colors: typeof import('picocolors')
  prompt: typeof import('@clack/prompts')
  run: typeof run
}

type RunFn<S extends string> = (
  fn: (ctx: Prettify<Args<S> & CmdContext>) => Promise<void> | void
) => Promise<void>

export function cmd(description: string) {
  let argsSpec: string | undefined

  function makeRun<S extends string>(spec: S): RunFn<S> {
    return async (fn) => {
      const colors = (await import(`picocolors`)).default

      if (process.argv.includes(`--help`) || process.argv.includes(`-h`)) {
        console.info()
        console.info(colors.bold(description))
        if (argsSpec) {
          console.info()
          const flags = [...argsSpec.matchAll(/--?([a-z-]+)\s+(string|number|boolean)/gi)]
          for (const [, flag, type] of flags) {
            console.info(`  --${flag}  ${colors.dim(type!)}`)
          }
        }
        console.info()
        process.exit(0)
      }

      const { $ } = await import(`bun`)
      const prompt = await import(`@clack/prompts`)
      const parsed = spec ? parseArgs(spec) : ({ _: [] } as Args<S>)
      await fn({ ...parsed, $, colors, prompt, run } as Prettify<Args<S> & CmdContext>)
    }
  }

  return {
    args<const S extends string>(spec: S) {
      argsSpec = spec
      return { run: makeRun(spec) }
    },
    run: makeRun(`` as ``),
  }
}
