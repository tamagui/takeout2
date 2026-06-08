import { cmd } from './cmd'

const SQLITE_NODE_PATH =
  'node_modules/@rocicorp/zero-sqlite3/build/Release/better_sqlite3.node'

await cmd`ensure zero-sqlite3 native module is built`.run(async ({ $, fs }) => {
  if (fs.existsSync(SQLITE_NODE_PATH)) {
    return
  }

  // bun trustedDependencies doesn't reliably run zero-sqlite3's install script,
  // so build/fetch the native module ourselves. run the package's OWN install
  // chain (`npm run install` = `prebuild-install || <binding exists?> ||
  // node-gyp rebuild`), which prefers the PREBUILT binary and only source-builds
  // as a last resort. @rocicorp/zero-sqlite3 >=1.1.2 is prebuilt-ONLY — its npm
  // tarball omits generated headers (e.g. unicode_case_data.h), so a direct
  // `npm run build-release` (node-gyp) fails; prebuild-install is the supported
  // path. success is "the binding now exists" (the install chain can exit
  // non-zero from a failed prebuild-install fallback even when an earlier step
  // already produced the binding).
  const result = await $`cd node_modules/@rocicorp/zero-sqlite3 && npm run install`
    .quiet()
    .nothrow()

  if (!fs.existsSync(SQLITE_NODE_PATH)) {
    console.error(
      'zero-sqlite3 native module unavailable, will fall back to wasm:',
      result.stderr.toString(),
    )
  }
})
