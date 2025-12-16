import { tamaguiPlugin } from '@tamagui/vite-plugin'
import { one } from 'one/vite'
import { visualizer } from 'rollup-plugin-visualizer'

import type { Plugin, UserConfig } from 'vite'

// client-only shim for react-dom-server - saves ~200KB
// SSR/SSG builds use the real module, client bundle gets stubs
function reactDomServerClientShim(): Plugin {
  const shimId = '\0react-dom-server-client-shim'
  return {
    name: 'react-dom-server-client-shim',
    enforce: 'pre',
    resolveId(id, _importer, options) {
      if (
        (id === 'react-dom/server.browser' || id === 'react-dom/server') &&
        !options.ssr
      ) {
        return shimId
      }
    },
    load(id) {
      if (id === shimId) {
        return `
export function renderToString() { throw new Error('react-dom-server not available in client bundle') }
export function renderToStaticMarkup() { throw new Error('react-dom-server not available in client bundle') }
export async function renderToReadableStream() { throw new Error('react-dom-server not available in client bundle') }
export const version = '19.0.0'
export default { renderToString, renderToStaticMarkup, renderToReadableStream, version }
`
      }
    },
  }
}

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
      // need both aliases because tamagui/one import react-native-web directly
      'react-native': '@tamagui/react-native-web-lite/without-animated',
      'react-native-web': '@tamagui/react-native-web-lite/without-animated',

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
    reactDomServerClientShim(),

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
