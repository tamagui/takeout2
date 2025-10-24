import { defineConfig } from 'vitest/config'
import { tamaguiPlugin } from '@tamagui/vite-plugin'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      'node_modules/**',
      'src/integration/**',
      '**/dist',
      '.sst/**',
      'src/apps/stripe/stripe-app/**',
    ],
    logHeapUsage: false,
    disableConsoleIntercept: true,
    testTimeout: 10_000,
  },

  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
      start: path.resolve(__dirname, './start/src'),
    },
  },

  plugins: [
    tamaguiPlugin({
      optimize: false,
      disableExtraction: true,
      disableInitialBuild: true,
      useReactNativeWebLite: true,
      components: ['tamagui'],
      config: './src/tamagui/tamagui.config.ts',
    }),
  ],
})
