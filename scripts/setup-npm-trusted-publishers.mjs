// one-time: configure npm trusted publishing for the orez package family.
// drives the npmjs.com UI in a headed browser — log in ONCE (tick the
// "remember for 5 minutes" 2FA box), press Enter in the terminal, and it
// walks all packages. run from ~/takeout (uses its playwright install):
//
//   bun scripts/setup-npm-trusted-publishers.mjs
//
// npm has no public API for trusted-publisher config, hence the browser.
import { createInterface } from 'node:readline/promises'
import { chromium } from 'playwright'

const PACKAGES = [
  'orez',
  'orez-sync-executor',
  'orez-sync-cf-host',
  'bedrock-sqlite',
  'pg-to-sqlite',
  'drizzle-zero-sqlite',
  'on-zero',
]

const PUBLISHER = {
  owner: 'natew',
  repository: 'orez',
  workflow: 'release.yml',
  environment: '', // intentionally blank
}

const browser = await chromium.launch({ headless: false, channel: 'chrome' })
const page = await browser.newPage()

await page.goto('https://www.npmjs.com/login')
console.info('\nlog in to npmjs.com in the opened browser.')
console.info('on the 2FA prompt, tick "remember for 5 minutes".')
const rl = createInterface({ input: process.stdin, output: process.stdout })
await rl.question('press Enter here once you are logged in... ')
rl.close()

const results = []
for (const pkg of PACKAGES) {
  try {
    await page.goto(`https://www.npmjs.com/package/${pkg}/access`)

    // the trusted publisher section lives on the package access/settings page.
    // selectors are text-based to survive markup changes; if npm moved the
    // section, fall back to the settings tab.
    const section = page.getByText(/trusted publisher/i).first()
    if (!(await section.isVisible().catch(() => false))) {
      await page.goto(`https://www.npmjs.com/package/${pkg}/settings`)
    }

    const github = page.getByText('GitHub Actions', { exact: false }).first()
    await github.click()

    await page.getByLabel(/organization or user/i).fill(PUBLISHER.owner)
    await page.getByLabel(/^repository$/i).fill(PUBLISHER.repository)
    await page.getByLabel(/workflow filename/i).fill(PUBLISHER.workflow)
    const env = page.getByLabel(/environment/i)
    if (await env.isVisible().catch(() => false)) await env.fill(PUBLISHER.environment)

    await page
      .getByRole('button', { name: /save|update|set up|connect/i })
      .first()
      .click()
    await page.waitForTimeout(1500)
    results.push(`✓ ${pkg}`)
    console.info(`✓ ${pkg}`)
  } catch (err) {
    results.push(`✗ ${pkg}: ${err.message.split('\n')[0]}`)
    console.error(`✗ ${pkg} — finish this one by hand in the open tab, then continue`)
    // leave the page where it is so you can fix it manually before the next one
    const rl2 = createInterface({ input: process.stdin, output: process.stdout })
    await rl2.question('press Enter to continue to the next package... ')
    rl2.close()
  }
}

console.info(`\ndone:\n${results.join('\n')}`)
console.info('\nverify: push any commit to orez main (or rerun the last Release run) and the canary should publish.')
await browser.close()
