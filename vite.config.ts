import { tamaguiPlugin } from '@tamagui/vite-plugin'
import { one } from 'one/vite'
import type { UserConfig } from 'vite'

export default {
  envPrefix: ['VITE_', 'TAMAGUI_'],

  server: {
    allowedHosts: ['host.docker.internal', 'onechat-dev-n8.start.chat'],
  },

  ssr: {
    noExternal: true,
    external: ['over-zero', '@vxrn/mdx'],
  },

  esbuild: {
    // for `over-zero`, may change how we do things here since it depends on function.name
    // i can see the argument that this is a standard JS feature tho so this is a fine default
    minifyIdentifiers: false,
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

      native: process.env.DISABLE_METRO
        ? {}
        : {
            bundler: 'metro', // Use Metro bundler for better React Native compatibility

            // TODO in one simplify the following:
            // bundlerOptions: {
            //   watchman: false, // had some slowness using this
            //   excludeModules: ['node:http2', 'jsonwebtoken', '@aws-sdk/*'],
            //   babelConfig: {
            //     plugins: ['hot-updater/babel-plugin'],
            //   },
            // },

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
                      if (
                        moduleName === 'node:http2' ||
                        moduleName === 'jsonwebtoken' ||
                        moduleName.startsWith('@aws-sdk/')
                      ) {
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

      setupFile: './src/setupClient.ts',

      router: {
        experimental: {
          preventLayoutRemounting: true,
        },
      },

      web: {
        defaultRenderMode: 'spa',
      },

      deps: {
        pg: true,
        'react-native-reanimated': {
          'lib/module/createAnimatedComponent/createAnimatedComponent.js': (contents) => {
            // if not using layout animations, this saves a super expensive repaint that happens often
            return contents?.replace(
              `return this._componentDOMRef.getBoundingClientRect();`,
              'return null;'
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
                  '@nandorojo/galeria',
                ],
              },
            },
          },
        },
      },
    }),
  ],
} satisfies UserConfig
