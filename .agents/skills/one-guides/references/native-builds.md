# Native projects and updates

[Native setup](https://onestack.dev/docs/native-setup), [iOS builds](https://onestack.dev/docs/guides-ios-native), [Expo migration](https://onestack.dev/native/migrating-to-one), [OTA](https://onestack.dev/docs/guides-ota-updates).

Current One uses Vite/Rolldown and OXC with no required Expo or Babel setup. Configure `native.app` in `vite.config.ts`, including app name and platform identifiers. Export `require('one/react-native-config')` from `react-native.config.cjs`.

```bash
npx one prebuild
npx one dev
# another terminal
npx one run:ios
# or: npx one run:android
```

Expo Go does not contain One's native components. A custom native binary is necessary. Metro is an optional dev bundler for a dependency that requires it; production JS still uses Rolldown. Use current CLI help and the app's scripts.

After changing permissions, native packages, icons, splash, capabilities, or release-used native groups, rerun the relevant prebuild and native build. Native API usage descriptions belong in `native.app`; for example `imagePicker.camera` supplies camera usage configuration. Prefer the manifest field over duplicating a generated Info.plist key.

For iOS distribution open `ios/*.xcworkspace`, configure the app's signing team/capabilities, archive, and distribute through Xcode. An unavailable workspace often means pods were not installed. A stale `ios/.xcode.env.local` can point to a removed Node executable.

EAS and Expo prebuild remain optional for apps keeping Expo tooling. Read the migration guide rather than adding old vxrn Expo plugins to every One app. Do not regenerate or delete hand-maintained native projects without understanding what the app owns.

`One.Updates` provides One's OTA path. Bundle updates must match the binary's runtime and native API set; they cannot add linked feature groups, native packages or permissions. Read the OTA guide and preserve the app's release process.
