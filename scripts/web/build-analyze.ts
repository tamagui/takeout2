#!/usr/bin/env bun
// @description Build with analyzer, run Lighthouse, open reports and site

import { $ } from 'bun'

const port = 9000 + Math.floor(Math.random() * 1000)
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const dir = 'reports'
const lhBase = `${dir}/lighthouse-${ts}`
const bundle = `${dir}/bundle-stats-${ts}.html`

console.info(`\n🔨 building with ANALYZE...\n`)
await $`rm -rf dist && mkdir -p ${dir}`
await $`ANALYZE=1 bun run web build`
await $`mv bundle_stats.html ${bundle}`.nothrow()

console.info(`\n🚀 starting server on port ${port}...\n`)
const server = Bun.spawn(['bun', 'one', 'serve', '--port', String(port)], {
  env: process.env,
  stdout: 'inherit',
  stderr: 'inherit',
})
await Bun.sleep(5000)

console.info(`\n📊 running lighthouse...\n`)
await $`npx lighthouse http://localhost:${port} --output=html,json --output-path=${lhBase} --chrome-flags="--headless --no-sandbox" --form-factor=mobile --throttling.cpuSlowdownMultiplier=4`.nothrow()

const r = await Bun.file(`${lhBase}.report.json`).json()
const s = (k: string) => Math.round(r.categories[k].score * 100)

console.info(`
📈 Lighthouse Scores:
   Performance:    ${s('performance')}
   Accessibility:  ${s('accessibility')}
   Best Practices: ${s('best-practices')}
   SEO:            ${s('seo')}

📂 Reports: ${bundle}, ${lhBase}.report.html

🌐 Opening browser tabs...
`)

await Promise.all([
  $`open ${bundle}`.nothrow(),
  $`open ${lhBase}.report.html`.nothrow(),
  $`open http://localhost:${port}`.nothrow(),
])

console.info(`✅ Server running at http://localhost:${port} (Ctrl+C to stop)\n`)
await server.exited
