# takeout — building outside Contrast

This export is a complete, standalone [One](https://onestack.dev) app.

## Web

```sh
bun install
bun dev              # local dev server
bun run build        # production build (dist/)
```

## iOS (requires macOS + Xcode)

```sh
bunx one prebuild --platform ios   # generates ios/ from app config
bunx one run:ios                   # build + launch on the simulator
```

For a signed device/App Store build, open `ios/*.xcworkspace` in Xcode and
archive with your own team + bundle id.

Release builds bundle the JS and bake in the server origin — set
`ONE_SERVER_URL=https://<your-deployed-app>` in the environment when
building for Release, or auth/data requests will point at a placeholder.

## Android (requires JDK 17 + Android SDK)

```sh
bunx one prebuild --platform android   # generates android/
cd android
./gradlew assembleDebug                # installable debug apk
# → android/app/build/outputs/apk/debug/app-debug.apk
./gradlew bundleRelease                # play-store .aab (configure signing first)
```

Or run directly on a connected device/emulator with `bunx one run:android`
(the run commands need `@react-native-community/cli` in devDependencies —
prebuild prints the exact line if it's missing).
