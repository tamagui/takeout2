- invite pavel to repo for uncloud integration

general:

- zero migrations needs improvement - lambda / part of migrate likely
- job system should be here
- get tests working

quan:

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

nate:

- server.asyncTasks => pushTask()
- new zero query style
- split scripts/\* into package?
  - sst/aws/github helpers are nice
- migrations stuff could maybe be a package
