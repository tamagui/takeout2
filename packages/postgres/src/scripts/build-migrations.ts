import { execSync } from 'node:child_process'
import path from 'node:path'

export type BuildMigrationsOptions = {
  migrationsDir: string
  outFile?: string
  target?: string
  aliases?: Record<string, string>
}

export async function buildMigrations(options: BuildMigrationsOptions) {
  const {
    migrationsDir,
    outFile = 'migrate-dist.js',
    target = 'node22',
    aliases = {},
  } = options

  const { build } = await import('vite')

  const migrateFile = path.join(migrationsDir, '..', 'migrate.ts')

  const result = await build({
    configFile: false,
    resolve: {
      alias: aliases,
    },
    define: {
      'process.env.GIT_SHA': JSON.stringify(
        execSync('git rev-parse HEAD').toString().trim()
      ),
    },
    build: {
      outDir: path.dirname(migrateFile),
      target,
      minify: false,
      emptyOutDir: false,
      copyPublicDir: false,
      lib: {
        name: 'migrate',
        formats: ['es'],
        entry: migrateFile,
      },
      rollupOptions: {
        external: (id) => {
          // externalize all node modules and node: imports
          if (id.startsWith('node:') || id === 'pg') return true
          // externalize all absolute paths (like aliases)
          if (id.startsWith('/')) return false
          // externalize node_modules
          if (!id.startsWith('.') && !id.startsWith('/')) return true
          return false
        },
        output: {
          format: 'es',
          inlineDynamicImports: true,
          exports: 'named',
          entryFileNames: outFile,
        },
      },
    },
  })

  console.info(`✓ Built migration bundle: ${outFile}`)
  return result
}
