type Prettify<T> = { [K in keyof T]: T[K] } & {}

type CmdContext = {
  $: typeof import('bun').$
  colors: typeof import('picocolors')
  prompt: typeof import('@clack/prompts')
  run: typeof import('./helpers/run').run
  fs: typeof import('node:fs')
  path: typeof import('node:path')
  os: typeof import('node:os')
}

type Args<S extends string> = import('./helpers/args').Args<S>

type RunFn<S extends string> = (
  fn: (ctx: Prettify<{ args: Args<S> } & CmdContext>) => Promise<void> | void
) => Promise<void>

let _interceptCmd: ((info: { description: string; args?: string }) => void) | undefined

export function setInterceptCmd(
  fn: ((info: { description: string; args?: string }) => void) | undefined
) {
  _interceptCmd = fn
}

function createCmd(description: string) {
  let argsSpec: string | undefined
  let envVars: Record<string, string> = {}

  function makeRun<S extends string>(spec: S): RunFn<S> {
    return async (fn) => {
      if (_interceptCmd) {
        _interceptCmd({ description, args: argsSpec })
        return
      }

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

      // apply env vars before running
      for (const [key, value] of Object.entries(envVars)) {
        process.env[key] = value
      }

      const [{ $ }, prompt, { run }, { args: parseArgs }, fs, path, os] =
        await Promise.all([
          import(`bun`),
          import(`@clack/prompts`),
          import(`./helpers/run`),
          import(`./helpers/args`),
          import(`node:fs`),
          import(`node:path`),
          import(`node:os`),
        ])

      const args = spec ? parseArgs(spec) : ({ rest: [] } as Args<S>)
      await fn({ args, $, colors, prompt, run, fs, path, os } as Prettify<
        { args: Args<S> } & CmdContext
      >)
    }
  }

  function makeChainable<S extends string>(spec: S) {
    return {
      env(vars: Record<string, string>) {
        Object.assign(envVars, vars)
        return this
      },
      run: makeRun(spec),
    }
  }

  return {
    env(vars: Record<string, string>) {
      Object.assign(envVars, vars)
      return this
    },
    args<const S extends string>(spec: S) {
      argsSpec = spec
      return makeChainable(spec)
    },
    run: makeRun(`` as ``),
  }
}

export function cmd(description: string): ReturnType<typeof createCmd>
export function cmd(strings: TemplateStringsArray): ReturnType<typeof createCmd>
export function cmd(input: string | TemplateStringsArray) {
  const description = typeof input === `string` ? input : input[0] || ``
  return createCmd(description)
}
