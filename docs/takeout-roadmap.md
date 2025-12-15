---
name: takeout-roadmap
description: Takeout roadmap, known issues, and planned features. Use when asking about bugs, planned features, v1/v2 plans, or what's on the todo list.
---

# Takeout Roadmap

- remove themes from js bundle

- "Customize web server port"
  - i cant find a way to make the native app default to a differnet port
    shockingly so this is sort of bad, id love to keep it though else we should
    dsiable before release

- getNextOnboardingStep / whitelist is messy need to plan/fix
  - see // Check whitelist status first (only if feature flag is enabled)

- package.json resolutions remove
  - fingerprint

v1:

- screens:
  - auth, onboard, feed, profile, settings

- site:
  - improve home design and wording
  - /docs with real docs

- native:
  - generally improved/native ui
  - hot-updates

- ci/cd:
  - sst working and tested for aws setup
  - uncloud working and tested for self-hosting
  - working actions to build to both app stores
    - can have eas and self-hosted options

- cleanup:
  - fix test.skip tests
  - zero migrations cleanup and move into package
  - move to new setupFile in one for client/server
  - remove dead files and generally reduce size
  - test thoroughly production builds / optimize
  - remove reanimated dependency on web entirely
  - publish tamagui config v5 and use that directly

- docs:
  - document asyncTasks/zero tips

v2:

- push notifications
- job system
- automated database backups on releases

---

# detailed

- dev server navigates us to `/help` on first load of `/` for some reason?

- slow startup of vite server:
  - i think in part its my last changes in one that run babel on all
    node_modules, especially because reanimated builds into a giant chunk
    - we should see if we can skip the babel processing of more files
    - we can skip this for ssr too right?

- Account button on site should borrow from tamagui.dev
  - show avatar when logged in

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
