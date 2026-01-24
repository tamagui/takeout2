# Takeout Roadmap

This is for the maintainers of this Takeout starter kit repo to track upcoming tasks, you may remove or keep if you want to track our tasks.

v1:

- ci/cd:
  - sst working and tested for aws setup
  - working actions to build to both app stores
    - can have eas and self-hosted options

- cleanup:
  - zero migrations cleanup and move into package

v2:

- push notifications
- job system
- automated database backups on releases

---

# backlog

- "Customize web server port"
  - i can't find a way to make the native app default to a different port
    shockingly so this is sort of bad, i'd love to keep it though else we should
    disable before release


- improve tree shaking out animated package:

vite config :

// use lightweight react-native, trims Animated and other unused things (~30+KB)
      // breaks in dev only, we can make a better plugin option for this
      // 'react-native': '@tamagui/react-native-web-lite/without-animated',
      // 'react-native-web': '@tamagui/react-native-web-lite/without-animated',

- dev server navigates us to `/help` on first load of `/` for some reason?

- slow startup of vite server:
  - i think in part its my last changes in one that run babel on all
    node_modules, especially because reanimated builds into a giant chunk
    - we should see if we can skip the babel processing of more files
    - we can skip this for ssr too right?

- Account button on site should borrow from tamagui.dev
  - show avatar when logged in

- Resend Code should be actually stored on the server - if i refresh the page it
  just counts down from 30 again when in fact i've waited already which is
  annoying
  - OTP isn't auto-submitting on paste
  - {"code":"INVALID_OTP","message":"Invalid OTP"} getting this but used right
    code

- dark/light setting isn't being saved properly to cookies like it does on
  tamagui.dev/onestack.dev

- we need to support / message about rebuilding the native app for a different
  port if they want something other than 8081
  - likewise i'd like there to be way less areas to touch when doing so

- can we prevent vscode autocomplete of external overlaps:
  - Image, Link, Dialog

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
- ci/cd for native apps
- production sst deploy (merge in good parts from fleek)
- hot update cleanup / into package ideally
- read over guides and improve/add, especially ci/cd, etc
