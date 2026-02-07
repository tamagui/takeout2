#!/usr/bin/env bun
// @description Build with analyzer, run Lighthouse, open reports and site
// Usage: bun tko web build-analyze [route]
// Example: bun tko web build-analyze /

import { cmd } from '@take-out/cli'

await cmd`Build with analyzer, run Lighthouse, open reports and site`.run(
  async ({ $ }) => {
    // find route arg - must start with / but not be a file path, default to /
    const route =
      process.argv.find((a) => a.startsWith('/') && !a.includes('.') && a.length < 50) ||
      '/'
    const port = 9000 + Math.floor(Math.random() * 1000)
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const dir = 'dist/report'
    const lhBase = `${dir}/lighthouse-${ts}`
    const bundle = `${dir}/bundle-stats-${ts}.html`

    console.info(`\n🔨 building with ANALYZE...\n`)
    await $`rm -rf dist`
    await $`ANALYZE=1 bun run web build`
    await $`mkdir -p ${dir}`
    await $`mv dist/client/bundle_stats.html ${bundle}`.nothrow()

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
🌐 Site: http://localhost:${port}
`)

    await Promise.all([
      $`open ${bundle}`.nothrow(),
      $`open ${lhBase}.report.html`.nothrow(),
    ])

    // per-route JS analysis if route provided
    if (route) {
      console.info(`\n📦 Analyzing JS for route: ${route}\n`)
      await analyzeRoute(route, port)
    }

    console.info(`✅ Done! Server running at http://localhost:${port} (ctrl+c to stop)\n`)

    await server.exited
  }
)

async function analyzeRoute(targetRoute: string, serverPort: number) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  const page = await browser.newPage()

  const jsFiles: string[] = []

  page.on('response', async (response) => {
    const url = response.url()
    if (url.endsWith('.js')) {
      jsFiles.push(url.replace(`http://localhost:${serverPort}/assets/`, ''))
    }
  })

  await page.goto(`http://localhost:${serverPort}${targetRoute}`, {
    waitUntil: 'networkidle',
  })
  await browser.close()

  // load bundle stats JSON (emitted to dist/client by visualizer)
  const statsFile = Bun.file('dist/client/bundle_stats.json')
  if (!(await statsFile.exists())) {
    console.info('No bundle_stats.json found, showing chunk names only\n')
    console.info(`Chunks loaded: ${jsFiles.length}`)
    for (const f of jsFiles) console.info(`  ${f}`)
    return
  }

  const stats = await statsFile.json()
  const { tree, nodeParts } = stats as {
    tree: {
      children: Array<{ name: string; children?: Array<{ name: string; uid?: string }> }>
    }
    nodeParts: Record<string, { renderedLength: number; gzipLength: number }>
  }

  const packages = new Map<string, { size: number; gzip: number }>()

  // map loaded chunks to their modules
  for (const chunk of tree.children || []) {
    const chunkName = chunk.name?.split('/').pop()?.replace('.js', '')
    if (!chunkName || !jsFiles.some((f) => f.includes(chunkName))) continue

    // walk modules in this chunk
    extractModules(chunk.children || [], nodeParts, packages)
  }

  // sort by size
  const sorted = [...packages.entries()].sort((a, b) => b[1].size - a[1].size)
  const totalSize = sorted.reduce((sum, [, v]) => sum + v.size, 0)
  const totalGzip = sorted.reduce((sum, [, v]) => sum + v.gzip, 0)

  console.info(`Route: ${targetRoute}`)
  console.info(`Total JS: ${fmt(totalSize)} (${fmt(totalGzip)} gzip)`)
  console.info(`Packages: ${sorted.length}, Chunks: ${jsFiles.length}\n`)
  console.info('Package'.padEnd(45) + 'Size'.padStart(12) + 'Gzip'.padStart(12))
  console.info('-'.repeat(69))

  for (const [pkg, { size, gzip }] of sorted.slice(0, 30)) {
    console.info(
      pkg.slice(0, 44).padEnd(45) + fmt(size).padStart(12) + fmt(gzip).padStart(12)
    )
  }

  if (sorted.length > 30) {
    console.info(`... and ${sorted.length - 30} more packages`)
  }
  console.info('')
}

type ModuleNode = { name: string; uid?: string; children?: ModuleNode[] }

function extractModules(
  nodes: ModuleNode[],
  nodeParts: Record<string, { renderedLength: number; gzipLength: number }>,
  packages: Map<string, { size: number; gzip: number }>,
  path = ''
) {
  for (const node of nodes) {
    const fullPath = path ? `${path}/${node.name}` : node.name
    const part = node.uid ? nodeParts[node.uid] : undefined
    if (part) {
      const { renderedLength, gzipLength } = part
      const pkg = getPackageName(fullPath)
      const existing = packages.get(pkg) || { size: 0, gzip: 0 }
      existing.size += renderedLength
      existing.gzip += gzipLength
      packages.set(pkg, existing)
    }
    if (node.children) {
      extractModules(node.children, nodeParts, packages, fullPath)
    }
  }
}

function getPackageName(path: string): string {
  const match = path.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/)
  if (match?.[1]) return match[1]
  if (path.includes('src/') || path.includes('app/')) return '[app code]'
  if (path.includes('packages/')) return '[packages]'
  return '[other]'
}

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  return `${(bytes / 1024).toFixed(1)}KB`
}
