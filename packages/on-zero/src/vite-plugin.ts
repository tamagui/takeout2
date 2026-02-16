import { isAbsolute, relative, resolve } from 'node:path'

import { generate, type GenerateOptions } from './generate'

import type { Plugin } from 'vite'

export interface OnZeroPluginOptions extends Omit<GenerateOptions, 'dir' | 'silent'> {
  /** base data directory. defaults to src/data */
  dir?: string
  /** additional paths to apply HMR fix to */
  hmrInclude?: string[]
  /** disable code generation (HMR only) */
  disableGenerate?: boolean
}

function createOnZeroHmrPlugin(hmrInclude: string[] = []): Plugin {
  const hmrPaths = ['/models/', '/generated/', '/queries/', ...hmrInclude]

  return {
    name: 'on-zero:hmr',
    apply: 'serve',
    enforce: 'post',

    transform(code, id) {
      if (!hmrPaths.some((p) => id.includes(p)) || !/\.tsx?$/.test(id)) return
      if (!code.includes('import.meta.hot.invalidate')) return

      return {
        code: code.replace(
          /if\s*\(invalidateMessage\)\s*import\.meta\.hot\.invalidate\(invalidateMessage\);?/g,
          '/* on-zero: HMR invalidate disabled */'
        ),
        map: null,
      }
    },
  }
}

function isWithinDirectory(file: string, dir: string): boolean {
  const rel = relative(dir, file)
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)
}

export function onZeroPlugin(options: OnZeroPluginOptions = {}): Plugin[] {
  const dir = options.dir ?? 'src/data'

  let dataDir: string
  let modelsDir: string
  let queriesDir: string

  const runGenerate = (silent: boolean) =>
    generate({
      dir: dataDir,
      after: options.after,
      silent,
    })

  return [
    {
      name: 'on-zero:serve',
      apply: 'serve',

      configResolved(config) {
        dataDir = resolve(config.root, dir)
        modelsDir = resolve(dataDir, 'models')
        queriesDir = resolve(dataDir, 'queries')
      },

      async buildStart() {
        if (!options.disableGenerate) await runGenerate(false)
      },

      configureServer(server) {
        if (options.disableGenerate) return

        const handler = async (file: string) => {
          if (!/\.tsx?$/.test(file)) return
          if (isWithinDirectory(file, modelsDir) || isWithinDirectory(file, queriesDir)) {
            await runGenerate(false)
          }
        }

        server.watcher.on('change', handler)
        server.watcher.on('add', handler)
        server.watcher.on('unlink', handler)
      },
    },

    {
      name: 'on-zero:build',
      apply: 'build',

      configResolved(config) {
        dataDir = resolve(config.root, dir)
      },

      async buildStart() {
        if (!options.disableGenerate) await runGenerate(true)
      },
    },

    createOnZeroHmrPlugin(options.hmrInclude),
  ]
}

export const onZeroHmrPlugin = (options?: { include?: string[] }): Plugin => {
  return createOnZeroHmrPlugin(options?.include)
}

export default onZeroPlugin
