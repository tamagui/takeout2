import { tamaguiPlugin } from '@tamagui/vite-plugin'
import { promises as fs } from 'node:fs'
import { one } from 'one/vite'
import type { UserConfig } from 'vite'

export default {
  envPrefix: ['VITE_', 'TAMAGUI_'],

  server: {
    allowedHosts: ['host.docker.internal', 'onechat-dev-n8.start.chat'],
  },

  ssr: {
    noExternal: ['better-auth-harmony', 'validator'],
  },

  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'jsx-for-expo-packages',
          setup(build) {
            build.onLoad(
              {
                filter:
                  /node_modules\/(expo-camera|expo-liquid-glass-view|expo-ios-popover-tip|expo-ios-text-animations|expo-ios-mesh-gradient|@expo\/ui).*\.js$/,
              },
              async (args) => ({
                contents: await fs.readFile(args.path, 'utf8'),
                loader: 'jsx',
              })
            )
          },
        },
      ],
    },
  },

  plugins: [
    tamaguiPlugin({
      optimize: true,
      disableExtraction: process.env.NODE_ENV !== 'production',
      disableServerOptimization: true,
      ...(process.env.DISABLE_CLIENT_OPTIMIZE && {
        optimize: false,
        disableExtraction: true,
      }),
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
      react: {
        compiler: true,
      },

      ...(!process.env.DISABLE_METRO && {
        native: {
          bundler: 'metro', // Use Metro bundler for better React Native compatibility
          bundlerOptions: {
            defaultConfigOverrides: (config) => {
              return {
                ...config,
                resolver: {
                  ...config?.resolver,
                  useWatchman: false, // We are encountering various issues with Watchman so we are disabling it for now
                  resolveRequest: (context, moduleName, platform) => {
                    const defaultResolveRequest =
                      config?.resolver?.resolveRequest || context.resolveRequest

                    // Workaround: resolve these to empty module because they will break the build
                    // We may want to refactor and make this not be imported at all in the RN build
                    if (moduleName === 'node:http2' || moduleName === 'jsonwebtoken') {
                      return defaultResolveRequest(
                        context,
                        '@vxrn/vite-plugin-metro/empty',
                        platform
                      )
                    }

                    const res = defaultResolveRequest(context, moduleName, platform)
                    return res
                  },
                },
              }
            },
          },
        },
      }),

      setupFile: './src/setupClient.ts',

      router: {
        experimental: {
          preventLayoutRemounting: true,
        },
      },

      web: {
        defaultRenderMode: 'spa',
      },

      optimization: {
        autoEntriesScanning: false,
      },

      deps: {
        pg: true,
        validator: true,

        '@expo/cli': {
          'build/src/export/embed/exportEmbedAsync.js': (contents) => {
            return contents?.replace(
              'exportEmbedAsync(projectRoot, options) {',
              'exportEmbedAsync(projectRoot, options) { console.warn("[one] skipping expo export:embed since it will not work properly, we just let the JS bundle build during the native build process where VxRN has control"); return;'
            )
          },
        },

        'react-native-reanimated': {
          'lib/module/createAnimatedComponent/createAnimatedComponent.js': (contents) => {
            // if not using layout animations, this saves a super expensive repaint that happens often
            return contents?.replace(
              `return this._componentDOMRef.getBoundingClientRect();`,
              'return null;'
            )
          },
        },

        // [TODO one] These are required when running with `vite` CLI (i.e. non-CLI mode)
        'expo-liquid-glass-view': {
          '**/*.js': ['jsx'],
        },
        '@expo/ui': {
          '**/*.js': ['jsx'],
        },
        // end [TODO one]
      },

      build: {
        api: {
          config: {
            build: {
              rollupOptions: {
                external: [
                  'ai',
                  '@rocicorp/zero',
                  'crawlee',
                  'better-auth',
                  'better-auth/plugins',
                  '@xenova/transformers',
                  '@statsig/statsig-node-core',
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
