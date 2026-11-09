# Troubleshooting

[Common issues](https://onestack.dev/docs/common-issues), [configuration](https://onestack.dev/docs/configuration).

Start with the failing import, installed dependency and environment. One's Vite/Rolldown native path differs from older Metro/Expo setups. Do not replace the bundler or add Babel config before locating the cause.

For an SSR dependency that needs transformation, inspect One's `ssr.autoDepsOptimization` and targeted Vite `ssr.noExternal` settings. `noExternal: true` can help diagnose an externalization problem but also bundles packages depending on Node path behavior. Avoid a broad permanent workaround when one dependency is responsible.

A missing default export or CommonJS `require` failure needs inspection of that package's exports and transformed module. Do not blindly exclude every failing package from optimizeDeps or add multiple CommonJS plugins. Packages publishing JSX or Flow in `.js` may need One's documented `patches` configuration.

Native fetch requires an absolute URL, for example `${process.env.ONE_SERVER_URL}/api/hello`. A physical device cannot use the computer's localhost; use an accessible dev host. Browser relative URLs are fine. Global native `fetch` supports response streaming; `One.Network` reports connectivity and is not a fetch client.

`Application has not been registered` can indicate a module failed before registration. Inspect the earlier error as well as `native.key` and the built container's registration name. After native API/permission changes, prebuild and rebuild the binary; clearing JS cache cannot add native code.

Current native setup exports `require('one/react-native-config')` from `react-native.config.cjs`. Read the [native build reference](native-builds.md) for missing pods/workspace or Expo migration issues.
