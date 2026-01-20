import { tamaguiPlugin } from '@tamagui/vite-plugin'
import { one, resolvePath } from 'one/vite'
import { visualizer } from 'rollup-plugin-visualizer'

import type { UserConfig } from 'vite'

export default {
  envPrefix: ['VITE_', 'TAMAGUI_'],

  resolve: {
    alias: [
      // use react-native-web-lite instead of react-native-web (~50% smaller)
      // must come before other aliases as array order matters
      {
        find: /^react-native$/,
        replacement: '@tamagui/react-native-web-lite',
      },
      {
        find: /^react-native-web$/,
        replacement: '@tamagui/react-native-web-lite',
      },
      {
        find: 'react-native/package.json',
        replacement: '@tamagui/react-native-web-lite/package.json',
      },
      // stub out bottom-tabs for web - one framework has it but we don't use it
      // tree shaking should get rid of it, need to investigate why not
      {
        find: '@react-navigation/bottom-tabs',
        replacement: resolvePath('./src/interface/shims/react-navigation-bottom-tabs.ts'),
      },
      // use lightweight svg for web (~2KB vs ~50KB)
      {
        find: 'react-native-svg',
        replacement: '@tamagui/react-native-svg',
      },
    ],
  },

  server: {
    allowedHosts: ['host.docker.internal'],
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
      '@take-out/helpers',
      '@legendapp/list',
      'zeego/dropdown-menu',
      'mdx-bundler/client',
      'react-native',
    ],
    // @hot-updater/cli-tools contains native .node binaries (oxc-transform)
    // that esbuild can't handle - exclude from optimization
    exclude: ['@hot-updater/cli-tools'],
  },

  ssr: {
    // we set this as it generally improves compatability by optimizing all deps for node
    noExternal: true,
    // @rocicorp/zero must be external to prevent Symbol mismatch between
    // @rocicorp/zero and @rocicorp/zero/server - they share queryInternalsTag
    // Symbol that must be the same instance for query transforms to work
    external: [
      'over-zero',
      '@vxrn/mdx',
      '@rocicorp/zero',
      'remark-smartypants',
      'retext',
      'retext-smartypants',
      '@nandorojo/galeria',
    ],
  },

  environments: {
    client: {
      build: {
        rollupOptions: {
          output: {
            // reduce parallel modulepreloads, helps web LCP
            experimentalMinChunkSize: 30_000,
          },
        },
      },
    },
  },

  plugins: [
    tamaguiPlugin({
      optimize: true,
      disableExtraction: process.env.NODE_ENV !== 'production',
      disableServerOptimization: true,
      useReactNativeWebLite: true,
      components: ['tamagui'],
      config: './src/tamagui/tamagui.config.ts',
      outputCSS: './src/tamagui/tamagui.css',
      themeBuilder: {
        input: './src/tamagui/themes-in.ts',
        output: './src/tamagui/themes-out.ts',
      },
    }),

    one({
      setupFile: {
        client: './src/setupClient.ts',
        native: './src/setupClient.ts',
        server: './src/setupServer.ts',
      },

      react: {
        compiler: true,
      },

      ssr: {
        autoDepsOptimization: {
          // TODO: add in ONE
          exclude: ['*/react-native-fast-squircle/*'],
        },
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
                    // reanimated worklet compilation - MUST be last
                    'react-native-reanimated/plugin',
                  ],
                }
              },
            },
          },

      router: {
        experimental: {
          typedRoutesGeneration: 'runtime',
        },
      },

      web: {
        experimental_scriptLoading: 'after-lcp-aggressive',
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
  ],
} satisfies UserConfig
