import { join, resolve } from 'node:path'

import { tamaguiPlugin } from '@tamagui/vite-plugin'
import { defineConfig } from 'vitest/config'

const rootDir = resolve(__dirname, '..', '..')

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/test/unit/**/*.test.ts',
      'src/test/unit/**/*.test.tsx',
      'packages/*/src/**/*.test.ts',
      'packages/*/src/**/*.test.tsx',
    ],
    outputFile: {
      json: 'src/test/unit/.output/results.json',
    },
    reporters: ['default', 'json'],
    logHeapUsage: false,
    disableConsoleIntercept: true,
    testTimeout: 10_000,
  },

  resolve: {
    alias: {
      '~': resolve(rootDir, 'src'),
    },
  },

  plugins: [
    tamaguiPlugin({
      disable: true,
      useReactNativeWebLite: true,
      components: ['tamagui'],
      config: join(rootDir, 'tamagui/tamagui.config.ts'),
    }),
  ],
})
