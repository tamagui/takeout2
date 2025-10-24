#!/usr/bin/env bun
import { build } from 'esbuild'
import { resolve } from 'node:path'

const isDev = process.env.NODE_ENV === 'development'

async function buildStartModules() {
  if (isDev) {
    console.info('skipping start modules build in development')
    return
  }

  console.info('building start modules for production...')

  // build start/ui module
  await build({
    entryPoints: [resolve('start/src/ui/index.ts')],
    bundle: true,
    format: 'esm',
    outfile: 'public/start-ui.js',
    platform: 'browser',
    external: ['react', 'react-dom'],
    minify: true,
  })

  // build start/app module
  await build({
    entryPoints: [resolve('start/src/app/index.ts')],
    bundle: true,
    format: 'esm',
    outfile: 'public/start-app.js',
    platform: 'browser',
    external: ['react', 'react-dom'],
    minify: true,
  })

  console.info('start modules built successfully')
}

buildStartModules().catch(console.error)
