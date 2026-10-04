// you own this file. edit freely — `one` will not regenerate it.
// withOne() invokes the same Metro pipeline One uses for production bundles.

const { withOne } = require('one/metro-config')
const oneBundlerOptions = {
  routerRoot: 'app',
  setupFile: {
    client: './src/setupClient.ts',
    native: './src/setupNative.ts',
    server: './src/setupServer.ts',
  },
}

module.exports = withOne(__dirname, oneBundlerOptions)
