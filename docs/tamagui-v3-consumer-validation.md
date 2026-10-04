# Current-main consumer integration

RAN: This port starts from main `271cb1995267e7ec8b7c72c5cfc1a741cb41a165`
and reapplies the predecessor's Tamagui v3 and One v2 migration. Main's `@o`
namespace, newer dependencies, and React Native 0.86.2 are retained.

RAN: Tamagui remains the coherent 3.0.0-beta.1564.1 family. The One family is
pinned to 2.0.0-0.canary.1791099485884 from `v2-beta`; its exact Metro tarball
records source `aaed02fbf4f1f034479af12863df7ee639a66af4` and preserves dependency
`dist/server` files. Seven existing `@o` packages use coherent
0.16.19-canary.1791096595015; the helper tarball records source
`5286a30c39365dcef0f8c28231e4672a1571cf3e` and exports the clipboard subpath.

RAN: Navigation's dependencies and overrides match the installed One artifact.
React Native Metro/Babel tooling overrides match the app's retained 0.86.2.
The custom tab bar supplies the new tabPress behavior data, preserving repeated
focused-tab scroll/pop behavior. Babel handles Voltra's namespace exports.
The app's Metro config retains One's pipeline and uses Expo's official serializer
for Expo export artifact output. No lockfile was hand-merged.

TESTED on ci-64 with Node 24.3.0 and Bun 1.4.2:

- `bun install` regenerated the lockfile.
- `bun check` passed on the final source.
- `bun test:unit`: 12 tests passed.
- `bun run:prod one build --platform=web` passed.
- Desktop 1440px and mobile 390px `/auth/signup/email` probes returned HTTP 200,
  measured 50px inputs, retained typed text and focus, stayed inside the viewport,
  and reported no page errors. The built app used the official development
  environment loader for local serving; no authenticated submission was made.
- `bunx expo export --platform ios --max-workers 2 --clear` passed on the final
  source: 4194 modules, an 11MB Hermes bundle, six assets and metadata.json.

RAN: Fresh native evidence is an export, not a simulator launch. Metro warns
about mdx-bundler's iOS export condition and falls back to its package files;
this warning remains visible and the export succeeds. No application deployment,
Takeout canary, stable package publication, or One/Tamagui main push ran.

RAN: Takeout main publication requires Nate's explicit approval. The validated
branch is pushed for that decision; this receipt does not claim main is landed.
