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
- [ ] Code signing works (MAC verification error on PKCS12 import)
- [ ] TestFlight upload works
- [ ] Cache is saved and restored properly
- [ ] Full end-to-end test passes

## Reference Projects
- ~/fleek - working iOS CD setup
- ~/chat - may have helpful examples

## Current Run
Run ID: 20087536859 - Testing fastlane 2.229.0+ with WWDR cert
Status: SSH key issue FIXED! Now testing certificate import issue

### Issue 6: Certificate import fails with MAC verification error
**Error:** `MAC verification failed during PKCS12 import (wrong password?)`
**Observed:** fastlane match says "All required keys, certificates and provisioning profiles are installed" but then `security set-key-partition-list` fails with `SecItemCopyMatching: The specified item could not be found in the keychain`
**Hypothesis:**
1. Match repo was created with fastlane 2.229.1 but CI was running 2.228.0
2. Missing WWDR intermediate certificate
**Fix Attempts:**
1. Upgraded fastlane min version to 2.229.0
2. Added Apple WWDR G3 certificate installation step
3. Enabled verbose mode for match

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

## DO NOT FINISH CHECKLIST
- [ ] Did you verify the build passes?
- [ ] Did you verify the IPA is created?
- [ ] Did you verify TestFlight upload works?
- [ ] Did you download and test the artifacts?
- [ ] Did you verify caching works?
- [ ] Did you run multiple CI builds to test cache?
- [ ] Did you test on a fresh cache?
- [ ] Did you verify the app runs on a device?
- [ ] Did you consider Android CD?
- [ ] Did you consider production build testing?
- [ ] Have you spent at least 2 hours verifying?

KEEP WORKING UNTIL ALL BOXES ARE CHECKED
# Regenerated certificates 2025-12-09
