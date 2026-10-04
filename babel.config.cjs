// you own this file. edit freely — `one` will not regenerate it.
// delegates to one/babel-preset which holds the canonical plugin chain.

const oneBabelPreset = require('one/babel-preset')
const preset = oneBabelPreset.default || oneBabelPreset
const oneBundlerOptions = {
  routerRoot: 'app',
  setupFile: {
    client: './src/setupClient.ts',
    native: './src/setupNative.ts',
    server: './src/setupServer.ts',
  },
}

module.exports = function (api) {
  const config = preset(api, oneBundlerOptions)
  return {
    ...config,
    plugins: ['@babel/plugin-transform-export-namespace-from', ...config.plugins],
  }
}
