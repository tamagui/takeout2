import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const baseline = process.argv[2]
const current = process.argv[3]
const diff = process.argv[4]
const maxDifference = Number(process.argv[5] ?? 0.5)
const fuzz = Number(process.argv[6] ?? 5)
const maskInput = process.argv[7]
const mask = maskInput?.split(',').map(Number)

if (
  !baseline ||
  !current ||
  !diff ||
  !Number.isFinite(maxDifference) ||
  !Number.isFinite(fuzz) ||
  (mask &&
    (mask.length !== 4 ||
      mask.some((value) => !Number.isFinite(value)) ||
      mask[0]! < 0 ||
      mask[1]! < 0 ||
      mask[2]! <= 0 ||
      mask[3]! <= 0))
) {
  throw new Error(
    'usage: bun scripts/web/compare-page.ts <baseline.png> <current.png> <diff.png> [max-difference-percent] [fuzz-percent] [mask-x,mask-y,mask-width,mask-height]',
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
  const command = [
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
  ]
  if (mask) {
    const [x, y, maskWidth, maskHeight] = mask
    command.push(
      '-fill',
      'white',
      '-draw',
      `rectangle ${x},${y} ${x! + maskWidth!},${y! + maskHeight!}`,
    )
  }
  command.push(destination)
  const result = await run(command)
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
      mask: mask ? { x: mask[0], y: mask[1], width: mask[2], height: mask[3] } : null,
      diff: diffPath,
    },
    null,
    2,
  ),
)

if (difference >= maxDifference) process.exitCode = 1
