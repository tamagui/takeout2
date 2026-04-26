import { cmd } from './cmd'

const SQLITE_NODE_PATH =
  'node_modules/@rocicorp/zero-sqlite3/build/Release/better_sqlite3.node'

await cmd`ensure zero-sqlite3 native module is built`.run(async ({ $, fs }) => {
  if (fs.existsSync(SQLITE_NODE_PATH)) {
    return
  }

  // bun trustedDependencies doesn't reliably build native modules
  const result = await $`cd node_modules/@rocicorp/zero-sqlite3 && npm run build-release`
    .quiet()
    .nothrow()

  if (result.exitCode !== 0) {
    console.error(
      'zero-sqlite3 build failed, will fall back to wasm:',
      result.stderr.toString(),
    )
  }
})
