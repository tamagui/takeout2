import { join } from 'node:path'

import { withTamagui } from '@tamagui/metro-plugin'
import { tamaguiAliases, tamaguiPlugin } from '@tamagui/vite-plugin'
import { autoWarmPlugin, one } from 'one/vite'
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
    include: ['async-retry'],

    // @hot-updater/cli-tools contains native .node binaries (oxc-transform)
    // that esbuild can't handle - exclude from optimization
    exclude: [
      '@hot-updater/cli-tools',
      'qrcode-terminal',
      'oxc-parser',
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
      'on-zero',
      '@vxrn/mdx',
      '@rocicorp/zero',
      '@opentelemetry/semantic-conventions',
      'retext',
      'retext-smartypants',
      // og image generation - native node addons
      '@resvg/resvg-js',
      'satori',
      // rolldown tree-shaking bug: drops AlgorithmId from @smithy re-exports
      '@aws-sdk/client-s3',
      '@aws-sdk/lib-storage',
      '@aws-sdk/core',
      '@aws-sdk/credential-provider-node',
      // rolldown tree-shaking bug: with sideEffects:false, rolldown drops
      // motion-dom/scale-border-radius.mjs (defines correctBorderRadius) while
      // keeping scale-correction.mjs that references it. externalizing avoids
      // the broken bundling and lets node resolve the correct import chain.
      // motion is no-oped on SSR anyway (Configuration disableSSR in app layout)
      'framer-motion',
      'motion-dom',
      'motion-utils',
    ],
  },

  plugins: [
    // learns which deps you need optimized so dev mode gets faster
    autoWarmPlugin('./warm-deps.generated.json'),

    tamaguiPlugin(
      // see tamagui.build.ts for configuration
      // this is what lets us nicely do commands like `bun tamagui generate-css`
    ),

    one({
      patches: {
        // better-auth's createDynamicPathProxy returns a recursive proxy for
        // unknown keys instead of undefined. react 19.2 / rn 0.83 introspect
        // objects ($$typeof, constructor, etc) triggering fake API calls and
        // 404 loops on native. fix: return undefined when path doesn't exist
        // in routes. see: better-auth/better-auth#6938
        // better-auth's proxy returns recursive proxies for ALL property access,
        // including introspection keys ($$typeof, constructor, toJSON). react 19.2
        // / rn 0.83 introspect objects more aggressively, triggering fake API calls.
        // extend existing then/catch/finally guard with common introspection keys.
        // see: better-auth/better-auth#6938
        'better-auth': {
          'dist/shared/better-auth.RKafzlkP.mjs': (contents) =>
            contents?.replace(
              'if (prop === "then" || prop === "catch" || prop === "finally")',
              'if (prop === "then" || prop === "catch" || prop === "finally" || prop === "$$$$typeof" || prop === "constructor" || prop === "toJSON" || prop === "nodeType")',
            ),
          'dist/shared/better-auth.8HJ5v58s.cjs': (contents) =>
            contents?.replace(
              'if (prop === "then" || prop === "catch" || prop === "finally")',
              'if (prop === "then" || prop === "catch" || prop === "finally" || prop === "$$$$typeof" || prop === "constructor" || prop === "toJSON" || prop === "nodeType")',
            ),
        },
      },

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
          // run the tamagui compiler on native - metro has no tamagui plugin by
          // default so without this the native bundle gets zero flattening.
          // one resolves the ~ alias in babel (module-resolver), which runs too
          // late for the tamagui linker, so teach metro's resolver the alias too
          defaultConfigOverrides: (config) => {
            const srcDir = join(import.meta.dirname, 'src')
            return withTamagui({
              ...config,
              resolver: {
                ...config.resolver,
                resolveRequest: (context, moduleName, platform) => {
                  const resolve = config.resolver?.resolveRequest ?? context.resolveRequest
                  if (moduleName.startsWith('~/')) {
                    return resolve(context, join(srcDir, moduleName.slice(2)), platform)
                  }
                  return resolve(context, moduleName, platform)
                },
              },
            })
          },
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
        inlineLayoutCSS: true,
        defaultRenderMode: 'spa',
        sitemap: {
          priority: 0.5,
          changefreq: 'weekly',
          exclude: [
            '/login/**',
            '/signup/**',
            '/profile-setup',
            '/avatar-setup',
            '/settings/**',
          ],
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
