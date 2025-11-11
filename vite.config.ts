import { tamaguiPlugin } from '@tamagui/vite-plugin'
import { one } from 'one/vite'
import type { UserConfig } from 'vite'

export default {
  envPrefix: ['VITE_', 'TAMAGUI_'],

  server: {
    allowedHosts: ['host.docker.internal', 'onechat-dev-n8.start.chat'],
    port: 8262,
  },

  optimizeDeps: {
    include: ['async-retry'],
  },

  ssr: {
    noExternal: true,
    external: ['over-zero', '@vxrn/mdx'],
  },

  esbuild: {
    // for `over-zero`, may change how we do things here since queries depend on function.name
    // i can see the argument that this is a standard JS feature though
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
      // setupFile: {
      //   client: './src/setupClient.ts',
      //   server: './src/setupServer.ts',
      //   // native: './src/setupNative.ts', // if you want to diverge
      // },

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
                ],
              },
            },
          },
        },
      },
    }),
  ],
} satisfies UserConfig
