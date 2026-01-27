import { tamaguiAliases, tamaguiPlugin } from '@tamagui/vite-plugin'
import { one, resolvePath } from 'one/vite'
import { visualizer } from 'rollup-plugin-visualizer'

import type { UserConfig } from 'vite'

export default {
  resolve: {
    alias: [
      // much smaller bundle size on web
      ...tamaguiAliases({
        rnwLite: 'without-animated',
        svg: true,
      }),
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
      '@tamagui/linear-gradient',
      '@rocicorp/zero',
      '@rocicorp/zero/react',
      'react-dom',
      '@take-out/helpers',
      '@legendapp/list',
      'zeego/dropdown-menu',
      'mdx-bundler/client',
      'react-native',

      // login/feed
      'react/jsx-runtime',
      'react-native-keyboard-controller',
      '@tamagui/config/v5-motion',
      '@tamagui/animations-motion',
      '@tamagui/menu',
    ],
    // @hot-updater/cli-tools contains native .node binaries (oxc-transform)
    // that esbuild can't handle - exclude from optimization
    exclude: [
      '@hot-updater/cli-tools',
      // we are avoiding reanimated on web - for many apps this may not be desirable
      // if you can live with motion/tamagui animations + one-off CSS, then its simpler
      // 'react-native-reanimated',
    ],
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
      'retext',
      'retext-smartypants',
      // og image generation - native node addons
      '@resvg/resvg-js',
      'satori',
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
      components: ['tamagui'],
      config: './src/tamagui/tamagui.config.ts',
      outputCSS: './src/tamagui/tamagui.css',
    }),

    one({
      setupFile: {
        client: './src/setupClient.ts',
        native: './src/setupNative.ts',
        server: './src/setupServer.ts',
      },

      react: {
        compiler: process.env.NODE_ENV === 'production',
      },

      native: {
        bundler: 'metro',
        bundlerOptions: {
          watchman: false, // had some slowness
          babelConfigOverrides: (config) => {
            return {
              ...config,
              plugins: [
                // React Compiler for automatic memoization - must run first
                'babel-plugin-react-compiler',
                ...(config?.plugins || []),
                // Hot Updater (React Native OTA solution)
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

        // fix RNGH crash on RN 0.81+ new architecture
        // getShadowNodeFromRef crashes when findHostInstance_DEPRECATED returns null
        'react-native-gesture-handler': {
          'lib/module/getShadowNodeFromRef.js': (contents) => {
            return contents?.replace(
              `return getInternalInstanceHandleFromPublicInstance(findHostInstance_DEPRECATED(ref)).stateNode.node;`,
              `const hostInstance = findHostInstance_DEPRECATED(ref);
  if (hostInstance === null || hostInstance === undefined) {
    return null;
  }
  const internalHandle = getInternalInstanceHandleFromPublicInstance(hostInstance);
  if (internalHandle === null || internalHandle === undefined) {
    return null;
  }
  return internalHandle.stateNode?.node ?? null;`
            )
          },
        },
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
