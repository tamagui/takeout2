# Configuration

[Configuration](https://onestack.dev/docs/configuration), [environment](https://onestack.dev/docs/environment), [native setup](https://onestack.dev/docs/native-setup).

```ts
import { one } from 'one/vite'
import type { UserConfig } from 'vite'

export default {
  plugins: [one({
    web: { defaultRenderMode: 'ssg', deploy: 'node' },
    native: {
      app: {
        name: 'MyApp',
        ios: { bundleId: 'com.example.myapp' },
        android: { applicationId: 'com.example.myapp' },
      },
    },
  })],
} satisfies UserConfig
```

Native dev defaults to `bundler: 'vite'`, using Rolldown and OXC. Set `bundler: 'metro'` only for a dependency that needs it. Production native JS bundling always uses Rolldown. `native.key` must match the native AppRegistry container. `native.app` owns generated app identifiers, icons, splash, permissions, capabilities and supported project patches. Run prebuild after changing native configuration; changing a native manifest cannot hot reload into an existing binary.

`react-native.config.cjs` should export `require('one/react-native-config')` for One's community native setup. Expo prebuild is an opt-in migration path, not a prerequisite.

Useful options to look up rather than invent:

- `web.linkPrefetch`, `inlineLayoutCSS`, `sitemap`, `skewProtection`.
- `setupFile`, per-environment `alias`, `router.root`, `router.ignoredRouteFiles`.
- `react.compiler`, `ssr.autoDepsOptimization`, `ssr.dedupeSymlinkedModules`.
- `build.workers`, `build.concurrency`, `build.securityScan`.
- `environmentGuards` for `server-only` / `client-only` imports.

Keep server imports confined to server exports. Only variables with `VITE_`, `EXPO_PUBLIC_`, or `ONE_PUBLIC_` prefixes are intentionally client exposed; never put secrets under those prefixes. Add `/// <reference types="one/env" />` to a declaration file for One's preset environment types.

`process.env.EXPO_OS` is One's build-time platform value, and `import.meta.env.VITE_ENVIRONMENT` identifies `client`, `ssr`, `ios`, or `android`. Native requests need an absolute server URL; set `ONE_SERVER_URL` for production loader/API access. A physical device cannot use your computer's localhost.

For dev/serve ports: `ONE_FORCE_PORT` wins over `--port`, which wins over `ONE_PORT`, then the command default. Use the CLI's `--host` or serve options as appropriate; do not assume generic `PORT`/`HOST` variables configure One.
