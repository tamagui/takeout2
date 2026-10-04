// you own this file. edit freely — `one` will not regenerate it.
// withOne() invokes the same Metro pipeline One uses for production bundles.

const { withOne } = require('one/metro-config')
const { getDefaultConfig } = require('expo/metro-config')
const expoConfig = getDefaultConfig(__dirname)
const oneBundlerOptions = {
  routerRoot: 'app',
  setupFile: {
    client: './src/setupClient.ts',
    native: './src/setupNative.ts',
    server: './src/setupServer.ts',
  },
}

module.exports = withOne(__dirname, oneBundlerOptions).then((config) => ({
  ...config,
  serializer: {
    ...config.serializer,
    // expo export expects its serializer's artifact format.
    customSerializer: expoConfig.serializer.customSerializer,
  },
}))
