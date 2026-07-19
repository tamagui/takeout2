import { expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('reuses one web authentication result inside the npm process', async () => {
  const root = await mkdtemp(join(tmpdir(), 'takeout-webauth-test-'))
  const moduleDirectory = join(root, 'node_modules', 'npm-profile')

  try {
    await mkdir(moduleDirectory, { recursive: true })
    await writeFile(
      join(moduleDirectory, 'index.js'),
      `let calls = 0
module.exports.webAuthOpener = async () => ({ token: String(++calls) })
`,
    )

    const process = Bun.spawn(
      [
        'node',
        '-e',
        `const profile = require('npm-profile'); Promise.all([profile.webAuthOpener(), profile.webAuthOpener()]).then(([first, second]) => { if (first.token !== '1' || second.token !== '1') process.exitCode = 1 })`,
      ],
      {
        cwd: root,
        env: {
          ...Bun.env,
          NODE_PATH: join(root, 'node_modules'),
          NODE_OPTIONS: `--require=${join(import.meta.dir, 'cache-npm-webauth.cjs')}`,
        },
        stdout: 'pipe',
        stderr: 'pipe',
      },
    )
    const [exitCode, , stderr] = await Promise.all([
      process.exited,
      new Response(process.stdout).text(),
      new Response(process.stderr).text(),
    ])

    expect(exitCode, stderr).toBe(0)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
