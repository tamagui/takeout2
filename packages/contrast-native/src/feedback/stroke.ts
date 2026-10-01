import type {
  FeedbackPoint,
  FeedbackRect,
  FeedbackStroke,
  FeedbackSurface,
} from './types'

// freehand marks: the counterpart to inspect's single tap. the surface that
// owns the canvas captures raw finger points in its own coordinate space and
// hands them here; this reduces them to the few points that actually describe
// the shape, so a reader receives "the user circled this area" instead of six
// hundred coordinates.

// keeps a serialized path short enough to read at a glance while still
// describing a loop or a zigzag unambiguously.
const MAX_POINTS = 28

export function strokeBounds(points: readonly FeedbackPoint[]): FeedbackRect {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  for (const point of points) {
    if (point.x < minX) minX = point.x
    if (point.y < minY) minY = point.y
    if (point.x > maxX) maxX = point.x
    if (point.y > maxY) maxY = point.y
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

// ramer-douglas-peucker: drop every point that sits within `tolerance` of the
// line its neighbours already describe. tolerance climbs until the result fits
// max_points, so a long scribble degrades to its overall shape rather than
// being truncated mid-stroke.
export function simplifyStroke(
  points: readonly FeedbackPoint[],
  tolerance: number,
): FeedbackPoint[] {
  if (points.length <= 2) return [...points]
  let epsilon = Math.max(tolerance, 0.5)
  let simplified = reduce(points, epsilon)
  while (simplified.length > MAX_POINTS) {
    epsilon *= 1.8
    simplified = reduce(points, epsilon)
  }
  return simplified
}

function reduce(points: readonly FeedbackPoint[], epsilon: number): FeedbackPoint[] {
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack: [number, number][] = [[0, points.length - 1]]
  while (stack.length > 0) {
    const segment = stack.pop()
    if (!segment) break
    const [start, end] = segment
    if (end - start < 2) continue
    const a = points[start]!
    const b = points[end]!
    const dx = b.x - a.x
    const dy = b.y - a.y
    const length = Math.hypot(dx, dy)
    let farthest = -1
    let farthestDistance = 0
    for (let i = start + 1; i < end; i++) {
      const point = points[i]!
      // degenerate segment (the stroke returned to its own start): fall back to
      // radial distance so a closed loop is not collapsed to two points.
      const distance =
        length === 0
          ? Math.hypot(point.x - a.x, point.y - a.y)
          : Math.abs(dy * point.x - dx * point.y + b.x * a.y - b.y * a.x) / length
      if (distance > farthestDistance) {
        farthestDistance = distance
        farthest = i
      }
    }
    if (farthest > 0 && farthestDistance > epsilon) {
      keep[farthest] = 1
      stack.push([start, farthest], [farthest, end])
    }
  }
  const out: FeedbackPoint[] = []
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i]!)
  return out
}

// a mark reads as "circled" when its ends meet relative to how big it is, so a
// small tight loop and a big loose one both qualify and a straight underline
// never does.
export function isClosedStroke(
  points: readonly FeedbackPoint[],
  bounds: { w: number; h: number },
): boolean {
  if (points.length < 4) return false
  const first = points[0]!
  const last = points[points.length - 1]!
  const diagonal = Math.hypot(bounds.w, bounds.h)
  if (diagonal <= 0) return false
  return Math.hypot(last.x - first.x, last.y - first.y) < diagonal * 0.35
}

// a device coordinate as a fraction of the surface it was measured on. this is
// the only geometry that survives leaving the device: the reader has an image
// of some size, not this screen.
export function normalizePoint(
  point: FeedbackPoint,
  surface: FeedbackSurface,
): FeedbackPoint {
  return {
    x: clampFraction(point.x / Math.max(1, surface.width)),
    y: clampFraction(point.y / Math.max(1, surface.height)),
  }
}

export function normalizeRect(
  rect: FeedbackRect,
  surface: FeedbackSurface,
): FeedbackRect {
  const width = Math.max(1, surface.width)
  const height = Math.max(1, surface.height)
  return {
    x: clampFraction(rect.x / width),
    y: clampFraction(rect.y / height),
    w: clampFraction(rect.w / width),
    h: clampFraction(rect.h / height),
  }
}

function clampFraction(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

// the one place raw finger points become a stroke. tolerance scales with the
// surface so the same gesture simplifies identically on a phone and a tablet.
export function buildStroke(
  raw: readonly FeedbackPoint[],
  surface: FeedbackSurface,
): FeedbackStroke | null {
  if (raw.length < 2) return null
  const tolerance = Math.max(2, Math.min(surface.width, surface.height) * 0.008)
  const points = simplifyStroke(raw, tolerance)
  const bounds = strokeBounds(points)
  return {
    points,
    normalizedPoints: points.map((point) => normalizePoint(point, surface)),
    bounds,
    normalizedBounds: normalizeRect(bounds, surface),
    closed: isClosedStroke(points, bounds),
    surface,
  }
}
