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
- [ ] Code signing works
- [ ] TestFlight upload works
- [ ] Cache is saved and restored properly
- [ ] Full end-to-end test passes

## Reference Projects
- ~/fleek - working iOS CD setup
- ~/chat - may have helpful examples

## Current Run
Run ID: 20086474231 PASSED changelog step - now fixing code signing
Status: Changelog fix worked! Code signing failed - SSH key format issue

### Issue 5: Code signing SSH key format error
**Error:** `Error loading key "(stdin)": invalid format` and `git@github.com: Permission denied (publickey)`
**Cause:** fastlane's `git_private_key` option passes the key via stdin, but GitHub secrets may strip or alter newlines
**Fix:** Write the SSH key to a temp file first, then pass the file path to `git_private_key`

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
**Fix Attempt 1:** Added `DISABLE_METRO=1` env var - FAILED (vxrn bundler includes Node.js code like `async_hooks`)
**Fix Attempt 2:** Using `expo export:embed` directly - TESTING NOW

### Issue 3: vxrn bundler includes Node.js code
**Error:** `main.jsbundle:282346:13: error: Invalid expression encountered - import('node:async_hooks')`
**Cause:** The `@vxrn/helpers` package has `asyncContext` which uses `import('node:async_hooks')`. This gets pulled in via `over-zero` → `@vxrn/helpers` → `createAsyncContext`. The vxrn bundler (when DISABLE_METRO=1) doesn't properly tree-shake server-only code.
**Fix:** Use `expo export:embed` which uses Expo's Metro config directly, not vxrn's

### Next Steps If Current Fix Fails
1. Check if .xcode.env.updates is being sourced properly
2. Check the build phase script in pbxproj
3. Consider modifying the build phase script directly
4. Look at how fleek handles this

## Commits Made
- 50f0c87: native: skip metro bundling during native build, bundle JS separately
- 5cb7dfc: native: fix path for .xcode.env.updates file (ios/ folder)
- a3c4785: native: use expo export:embed for JS bundling in CI
- 1620131: native: fetch full git history for changelog generation
- 756c417: native: fix changelog cwd to use GITHUB_WORKSPACE
- (pending): native: write ssh key to file for code signing

### Issue 4: Changelog generation fails with "Invalid revision range"
**Error:** `fatal: Invalid revision range 7d922047f821607f28e4e03e03e54b2d25db068a..a3c47855b42660f895cbf69acb79c4204ad4d816`
**Cause:** The `executeCommand` function in generate-changelog-from-github-context.cjs was using `cwd: __dirname` which points to `.github/actions/generate-changelog/`, not the repository root. Git commands couldn't find commits because they were running in the wrong directory.
**Fix:** Changed to use `process.env.GITHUB_WORKSPACE || process.cwd()` instead of `__dirname`

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
