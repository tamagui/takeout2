import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const baseline = process.argv[2]
const current = process.argv[3]
const diff = process.argv[4]
const maxDifference = Number(process.argv[5] ?? 0.5)
const fuzz = Number(process.argv[6] ?? 5)

if (
  !baseline ||
  !current ||
  !diff ||
  !Number.isFinite(maxDifference) ||
  !Number.isFinite(fuzz)
) {
  throw new Error(
    'usage: bun scripts/web/compare-page.ts <baseline.png> <current.png> <diff.png> [max-difference-percent] [fuzz-percent]',
  )
}

async function run(command: string[]) {
  const child = Bun.spawn(command, { stderr: 'pipe', stdout: 'pipe' })
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ])
  return { exitCode, stdout, stderr }
}

async function dimensions(path: string) {
  const result = await run(['magick', 'identify', '-format', '%w %h', path])
  if (result.exitCode !== 0) throw new Error(result.stderr)
  const [width, height] = result.stdout.trim().split(' ').map(Number)
  if (!width || !height) throw new Error(`could not read dimensions for ${path}`)
  return { width, height }
}

const baselinePath = resolve(baseline)
const currentPath = resolve(current)
const diffPath = resolve(diff)
const [baselineSize, currentSize] = await Promise.all([
  dimensions(baselinePath),
  dimensions(currentPath),
])
const width = 1440
const height = Math.max(baselineSize.height, currentSize.height)
const scratch = await mkdtemp(join(tmpdir(), 'takeout-page-diff-'))
const normalizedBaseline = join(scratch, 'baseline.png')
const normalizedCurrent = join(scratch, 'current.png')

for (const [source, size, destination] of [
  [baselinePath, baselineSize, normalizedBaseline],
  [currentPath, currentSize, normalizedCurrent],
] as const) {
  const cropWidth = Math.min(width, size.width)
  const result = await run([
    'magick',
    source,
    '-crop',
    `${cropWidth}x${size.height}+0+0`,
    '+repage',
    '-background',
    'white',
    '-gravity',
    'northwest',
    '-extent',
    `${width}x${height}`,
    destination,
  ])
  if (result.exitCode !== 0) throw new Error(result.stderr)
}

const comparison = await run([
  'magick',
  'compare',
  '-metric',
  'AE',
  '-fuzz',
  `${fuzz}%`,
  normalizedBaseline,
  normalizedCurrent,
  diffPath,
])
if (comparison.exitCode > 1) throw new Error(comparison.stderr)

const differentPixels = Number.parseFloat(comparison.stderr)
const totalPixels = width * height
const difference = (differentPixels / totalPixels) * 100
console.info(
  JSON.stringify(
    {
      baseline: baselineSize,
      current: currentSize,
      compared: { width, height },
      differentPixels,
      differencePercent: difference,
      fuzzPercent: fuzz,
      maxDifferencePercent: maxDifference,
      diff: diffPath,
    },
    null,
    2,
  ),
)

if (difference >= maxDifference) process.exitCode = 1
