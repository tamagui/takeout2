- Resend Code should be actually stored on the server - if i refresh the page it
  just counts down from 30 again when in fact ive waited already whihc is
  anonying
  - OTP isnt auto-submitting on paste
  - {"code":"INVALID_OTP","message":"Invalid OTP"} getting this but used right
    code

- dark/light setting isnt being saved properly to cookies like ti does on
  tamagui.dev/onestack.dev

- we need to support / message about rebuilding the native app for a different
  port if they want something other than 8081
  - likewise i'd like there to be way less areas to touch when doing so

- can we prevent vscode autocomplete of extenral overlaps:
  - Image, Link, Dialog

general:

- zero migrations needs improvement - lambda / part of migrate likely
- fix test.skip tests
- job system should be here
- re-enable database backup in ci.ts once ./src/database/scripts/backup.ts is
  available

quan:

- remove public/images/\* i think
- get auth flows working
- get home/tabs working
- remove lots more native dependencies
- replace a lot of one-off deps with expo versions if we can
- removing vibe-coded comments everywhere
- review the entire codebase and cleanup
- `eb.and(draftCondition, notFromBlockedUsers)` cant bring blocked down to
  client like this
  - we'd need to have a separate generated feed need to discuss

pokai:

- deps optimization is a mess took me forever to fix issues and nothing worked
  like i expected (setting ssr.external/noExternal etc)
- import '~/setupServer' (setupFile support web(server+client)/native)
- [TODO one], cleanup vite.config as much as can via one itself
- can we get app.config, react-native.config and .xcode-version by chance into a
  sub-folder? maybe .xcode-version into ios/\*?
  - could we have ios/android folder build into maybe src/ios?
- ci/cd for native apps
- production sst deploy (merge in good parts from fleek)
- hot update cleanup / into package ideally
- read over guides and improve/add, especially ci/cd, etc
