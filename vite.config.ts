import { tamaguiPlugin } from '@tamagui/vite-plugin'
import { one } from 'one/vite'
import { visualizer } from 'rollup-plugin-visualizer'

import type { UserConfig } from 'vite'

export default {
  envPrefix: ['VITE_', 'TAMAGUI_'],

  resolve: {
    alias: {
      // stub out bottom-tabs for web - one framework has it but we don't use it
      // tree shaking should get rid of it, need to investigate why not
      '@react-navigation/bottom-tabs': './src/shims/react-navigation-bottom-tabs.ts',

      // use lightweight svg for web (~2KB vs ~50KB)
      'react-native-svg': '@tamagui/react-native-svg',

      // use lightweight react-native, trims Animated and other unused things (~30+KB)
      'react-native': '@tamagui/react-native-web-lite/without-animated',
      // 'react-native-web': '@tamagui/react-native-web-lite/without-animated',
    },
  },

  server: {
    allowedHosts: ['host.docker.internal', 'onechat-dev-n8.start.chat'],
    port: 8081,
  },

  optimizeDeps: {
    include: [
      'async-retry',
      // pre-bundle common web deps to avoid mid-navigation optimization in dev mode
      'better-auth/client',
      'better-auth/client/plugins',
      '@tamagui/toast',
      '@tamagui/animate-presence',
      '@tamagui/react-native-svg',
      '@tamagui/image-next',
      '@tamagui/linear-gradient',
      '@rocicorp/zero',
      '@rocicorp/zero/react',
      'react-dom',
      '@vxrn/helpers',
      '@legendapp/list',
      'zeego/dropdown-menu',
      'mdx-bundler/client',
      'react-native',
    ],
  },

  ssr: {
    noExternal: true,
    // @rocicorp/zero must be external to prevent Symbol mismatch between
    // @rocicorp/zero and @rocicorp/zero/server - they share queryInternalsTag
    // Symbol that must be the same instance for query transforms to work
    external: ['over-zero', '@vxrn/mdx', '@rocicorp/zero'],
  },

  plugins: [
    tamaguiPlugin({
      optimize: true,
      disableExtraction: process.env.NODE_ENV !== 'production',
      disableServerOptimization: true,
      components: ['tamagui'],
      config: './src/tamagui/tamagui.config.ts',
      outputCSS: './src/tamagui/tamagui.css',
      themeBuilder: {
        input: './src/tamagui/themes-in.ts',
        output: './src/tamagui/themes-out.ts',
      },
    }),

    ...(process.env.ANALYZE
      ? [
          visualizer({
            filename: 'bundle_stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
            emitFile: true,
          }),
          visualizer({
            filename: 'bundle_stats.json',
            template: 'raw-data',
            gzipSize: true,
            brotliSize: true,
            emitFile: true,
          }),
        ]
      : []),

    one({
      setupFile: {
        client: './src/setupClient.ts',
        native: './src/setupClient.ts',
        server: './src/setupServer.ts',
      },

      react: {
        compiler: true,
      },

      native: process.env.DISABLE_METRO
        ? {}
        : {
            bundler: 'metro',
            bundlerOptions: {
              watchman: false, // had some slowness using this
              babelConfigOverrides: (config) => {
                return {
                  ...config,
                  plugins: [
                    ...(config?.plugins || []),
                    // Hot Updater (React Native OTA solution)
                    // https://github.com/gronxb/hot-updater/blob/main/packages/hot-updater/src/plugins/babel.ts
                    'hot-updater/babel-plugin',
                  ],
                }
              },
            },
          },

      router: {
        experimental: {
          preventLayoutRemounting: true,
          typedRoutesGeneration: 'runtime',
        },
      },

      web: {
        defaultRenderMode: 'spa',
        inlineLayoutCSS: true,
        sitemap: {
          priority: 0.5,
          changefreq: 'weekly',
          exclude: [
            '/login/**',
            '/signup/**',
            '/profile-setup',
            '/avatar-setup',
            '/waiting-list',
            '/settings/**',
          ],
        },
      },

      deps: {
        pg: true,
      },

      build: {
        api: {
          config: {
            build: {
              rollupOptions: {
                external: [
                  '@rocicorp/zero',
                  'better-auth',
                  'better-auth/plugins',
                  'sharp',
                ],
              },
            },
          },
        },
      },
    }),
  ],
} satisfies UserConfig
