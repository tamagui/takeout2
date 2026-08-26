import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { chromium } from 'playwright'

const baseUrl = process.argv[2]
const outputDir = process.argv[3]
const targetTheme = process.argv[4] ?? 'light'
const isComparisonBaseline = process.argv[5] === 'baseline'

if (!baseUrl || !outputDir || (targetTheme !== 'light' && targetTheme !== 'dark')) {
  throw new Error(
    'usage: bun scripts/web/capture-pages.ts <base-url> <output-dir> [light|dark]',
  )
}

const origin = new URL(baseUrl).origin
const docs = (await readdir(resolve('src/features/site/docs')))
  .filter((name) => name.endsWith('.mdx'))
  .map((name) => `/docs/${name.slice(0, -4)}`)
  .sort()
const routes = ['/', '/help', '/eula', '/privacy-policy', '/terms-of-service', ...docs]

await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({
  colorScheme: 'light',
  deviceScaleFactor: 1,
  viewport: { width: 1440, height: 1000 },
})
const cdp = await page.context().newCDPSession(page)
const pageErrors: Error[] = []
const consoleErrors: string[] = []
page.on('pageerror', (error) => pageErrors.push(error))
page.on('console', (message) => {
  const type = message.type()
  const value = message.text()
  if (
    type === 'error' ||
    (type === 'warning' && /react|hydration|tamagui|one error boundary/i.test(value))
  ) {
    const location = message.location()
    const source = location.url
      ? `${location.url}:${location.lineNumber}`
      : 'unknown source'
    consoleErrors.push(`[${type}] ${source} ${value}`)
  }
})

async function switchTheme() {
  const toggle = page.getByRole('button', { name: 'Toggle theme' }).first()
  if ((await toggle.count()) !== 1) {
    throw new Error('theme toggle did not render')
  }

  await page.waitForFunction(() => {
    const element = document.querySelector('button[aria-label="Toggle theme"]')
    return element && Object.keys(element).some((key) => key.startsWith('__reactProps$'))
  })

  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await page.evaluate(
      () => localStorage.getItem('vxrn-scheme') ?? 'system',
    )
    const hasTargetClass = await page.evaluate(
      (theme) => document.documentElement.classList.contains(`t_${theme}`),
      targetTheme,
    )
    if (current === targetTheme && hasTargetClass) return

    const settings = ['light', 'dark', 'system'] as const
    const next =
      settings[(settings.indexOf(current as (typeof settings)[number]) + 1) % 3]!
    await toggle.click()
    await page.waitForFunction(
      ({ setting, theme }) =>
        localStorage.getItem('vxrn-scheme') === setting &&
        document.documentElement.classList.contains(`t_${theme}`),
      { setting: next, theme: next === 'system' ? 'light' : next },
    )
  }

  throw new Error(`theme toggle did not switch to ${targetTheme}`)
}

for (const route of routes) {
  pageErrors.length = 0
  consoleErrors.length = 0
  const response = await page.goto(new URL(route, origin).href, {
    waitUntil: 'load',
  })

  if (!response?.ok()) {
    throw new Error(`${route}: ${response?.status() ?? 'no response'}`)
  }

  await switchTheme()
  await page.evaluate(() => document.fonts.ready)
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-play-state: paused !important;
        caret-color: transparent !important;
      }
    `,
  })
  await page.locator('video').evaluateAll(async (videos) => {
    for (const element of videos) {
      const video = element as HTMLVideoElement
      video.pause()
      video.removeAttribute('src')
      video.querySelectorAll('source').forEach((source) => source.remove())
      video.load()
    }
    await new Promise<void>((resolveVideoFrame) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolveVideoFrame())),
    )
  })
  await page.evaluate(
    () =>
      new Promise<void>((resolveLayout) => {
        let previousHeight = -1
        let stableFrames = 0
        const checkLayout = () => {
          const height = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
          )
          stableFrames = height === previousHeight ? stableFrames + 1 : 0
          previousHeight = height
          if (stableFrames >= 3) {
            resolveLayout()
          } else {
            requestAnimationFrame(checkLayout)
          }
        }
        requestAnimationFrame(checkLayout)
      }),
  )

  const text = await page.locator('body').innerText()
  if (!text.trim() || text.includes('Press Alt+E to view error details')) {
    throw new Error(`${route}: rendered an invalid body\n${text.slice(0, 500)}`)
  }
  if (!isComparisonBaseline && pageErrors.length) {
    throw new Error(`${route}: ${pageErrors.map((error) => error.stack).join('\n')}`)
  }
  if (!isComparisonBaseline && consoleErrors.length) {
    throw new Error(`${route}: browser console errors\n${consoleErrors.join('\n')}`)
  }
  if (route === '/' && !isComparisonBaseline) {
    const glintColors = await page
      .getByTestId('button-glint')
      .evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).borderTopColor),
      )
    const expectedGlintColor =
      targetTheme === 'light' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)'
    if (
      !glintColors.length ||
      glintColors.some((color) => color !== expectedGlintColor)
    ) {
      throw new Error(
        `/${targetTheme}: invalid button glint colors ${JSON.stringify(glintColors)}`,
      )
    }
  }

  const name = route === '/' ? 'index' : route.slice(1).replaceAll('/', '--')
  const path = resolve(outputDir, `${name}.png`)
  const height = await page.evaluate(() =>
    Math.ceil(
      Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
    ),
  )
  const screenshot = await cdp.send('Page.captureScreenshot', {
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: 1440, height, scale: 1 },
    format: 'png',
    fromSurface: true,
  })
  await writeFile(path, Buffer.from(screenshot.data, 'base64'))
  if (!isComparisonBaseline && pageErrors.length) {
    throw new Error(`${route}: ${pageErrors.map((error) => error.stack).join('\n')}`)
  }
  if (!isComparisonBaseline && consoleErrors.length) {
    throw new Error(`${route}: browser console errors\n${consoleErrors.join('\n')}`)
  }
  console.info(`${route} -> ${path}`)
}

await browser.close()
