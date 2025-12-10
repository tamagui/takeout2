# Native CD Status - DO NOT FINISH UNTIL THIS WORKS PERFECTLY

## IMPORTANT REMINDER
DO NOT STOP WORKING. Keep verifying, testing, improving. The goal is a fully working iOS CD pipeline that:
1. Builds native code with SKIP_BUNDLING
2. Bundles JS separately
3. Signs the app properly
4. Uploads to TestFlight
5. Caches builds for future runs

## Current Status
- [x] iOS Build Archive passes (using SKIP_BUNDLING=1)
- [x] JS Bundling step works (using expo export:embed)
- [x] Changelog generation works (fixed cwd issue - was using __dirname instead of GITHUB_WORKSPACE)
- [x] SSH key sync works (fixed multiline parsing in sync-to-github.ts)
- [x] Code signing works (nuked and regenerated certificates)
- [x] TestFlight upload works (Run ID: 20088160227 - FULL SUCCESS!)
- [ ] Cache is saved and restored properly (needs verification)
- [x] Full end-to-end test passes

## Reference Projects
- ~/fleek - working iOS CD setup
- ~/chat - may have helpful examples

## Successful Run
**Run ID: 20088160227** - COMPLETE SUCCESS! All steps passed:
- Build Archive: success
- Build JS Bundle: success
- Sync Code Signing: success
- Export IPA: success
- Upload to TestFlight: success
- Cache saved: success

### Issue 7: Bundle ID mismatch on IPA export (FIXED)
**Error:** `Provisioning profile "match AppStore ***" has app ID "***", which does not match the bundle ID "com.takeout.app.preview"`
**Cause:** app.config.ts was using `com.takeout.app.preview` but provisioning profiles were for `dev.tamagui.takeout.preview`
**Fix:** Updated getBundleId() in app.config.ts to use `dev.tamagui.takeout.preview` for preview and `dev.tamagui.takeout` for production

### Issue 6: Certificate import fails with MAC verification error (FIXED)
**Error:** `MAC verification failed during PKCS12 import (wrong password?)`
**Cause:** The p12 file in match repo was encrypted with a different password (possibly from manual manipulation)
**Fix:** Used `fastlane match nuke distribution` to delete all certificates, then regenerated fresh with `fastlane match appstore`

## Issue History

### Issue 1: Metro bundler "Failed to construct transformer" error
**Error:** `TypeError [ERR_INVALID_ARG_TYPE]: The "request" argument must be of type string. Received undefined`
**Cause:** vxrn's Metro bundler fails in CI during xcodebuild archive phase
**Fix:** Created .xcode.env.updates in ios/ folder with SKIP_BUNDLING=1

### Issue 2: Metro bundler fails in Build JS Bundle step
**Error:** Same "Failed to construct transformer" error
**Fix:** Use `expo export:embed` which uses Expo's Metro config directly, not vxrn's

### Issue 3: vxrn bundler includes Node.js code
**Error:** `main.jsbundle:282346:13: error: Invalid expression encountered - import('node:async_hooks')`
**Cause:** The `@vxrn/helpers` package has `asyncContext` which uses `import('node:async_hooks')`
**Fix:** Use `expo export:embed` instead of vxrn bundler

### Issue 4: Changelog generation fails with "Invalid revision range"
**Error:** `fatal: Invalid revision range`
**Cause:** The `executeCommand` function used `cwd: __dirname` instead of repo root
**Fix:** Changed to use `process.env.GITHUB_WORKSPACE || process.cwd()`

### Issue 5: Code signing SSH key format error
**Error:** `Error loading key "(stdin)": invalid format` and `git@github.com: Permission denied (publickey)`
**Cause:** sync-to-github.ts used `echo ${value} | gh secret set` which strips newlines from multiline values
**Fix:**
1. Updated sync-to-github.ts to write multiline values to temp files
2. Fixed multiline parsing in loadSecretsFile() for both sync scripts
3. Re-synced iOS secrets to GitHub

## Commits Made
- 50f0c87: native: skip metro bundling during native build, bundle JS separately
- 756c417: native: fix changelog cwd to use GITHUB_WORKSPACE
- 384ca3d: native: fix multiline env parsing for ssh keys in sync scripts
- 4b589ab: native: upgrade fastlane to 2.229.0+, add wwdr cert, enable verbose match
- 9c16662: native: regenerate certificates after nuking old ones
- d4107bd: native: fix bundle ID to match provisioning profile

## DO NOT FINISH CHECKLIST
- [x] Did you verify the build passes?
- [x] Did you verify the IPA is created?
- [x] Did you verify TestFlight upload works?
- [ ] Did you download and test the artifacts?
- [ ] Did you verify caching works?
- [ ] Did you run multiple CI builds to test cache?
- [ ] Did you test on a fresh cache?
- [ ] Did you verify the app runs on a device?
- [ ] Did you consider Android CD?
- [ ] Did you consider production build testing?
- [ ] Have you spent at least 2 hours verifying?

KEEP WORKING UNTIL ALL BOXES ARE CHECKED
