# Native CD Status - DO NOT FINISH UNTIL THIS WORKS PERFECTLY

## IMPORTANT REMINDER
DO NOT STOP WORKING. Keep verifying, testing, improving. The goal is a fully working iOS CD pipeline that:
1. Builds native code with SKIP_BUNDLING
2. Bundles JS separately
3. Signs the app properly
4. Uploads to TestFlight
5. Caches builds for future runs

## Current Status
- [ ] iOS Build Archive passes
- [ ] JS Bundling step works
- [ ] Code signing works
- [ ] TestFlight upload works
- [ ] Cache is saved and restored properly
- [ ] Full end-to-end test passes

## Reference Projects
- ~/fleek - working iOS CD setup
- ~/chat - may have helpful examples

## Current Run
Run ID: 20086052536
Status: Queued

## Issue History

### Issue 1: Metro bundler "Failed to construct transformer" error
**Error:** `TypeError [ERR_INVALID_ARG_TYPE]: The "request" argument must be of type string. Received undefined`
**Cause:** vxrn's Metro bundler fails in CI during xcodebuild archive phase
**Fix Attempts:**
1. Added CLI_PATH environment variable - FAILED (still ran bundling)
2. Added SKIP_BUNDLING=1 in env block - FAILED (not passed to xcode build phase)
3. Created .xcode.env.updates in root - FAILED (wrong location)
4. Created .xcode.env.updates in ios/ folder - PARTIAL SUCCESS (Build Archive passed!)

### Issue 2: Metro bundler fails in Build JS Bundle step
**Error:** Same "Failed to construct transformer" error
**Cause:** The vite.config.ts has `native.bundler: 'metro'` which uses Metro for bundling
**Fix:** Added `DISABLE_METRO=1` env var which triggers vite.config.ts to use vxrn's native bundler instead - TESTING NOW

### Next Steps If Current Fix Fails
1. Check if .xcode.env.updates is being sourced properly
2. Check the build phase script in pbxproj
3. Consider modifying the build phase script directly
4. Look at how fleek handles this

## Commits Made
- 50f0c87: native: skip metro bundling during native build, bundle JS separately
- 5cb7dfc: native: fix path for .xcode.env.updates file (ios/ folder)

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
