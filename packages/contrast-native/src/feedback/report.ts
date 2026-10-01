import type {
  FeedbackAnnotation,
  FeedbackConfig,
  FeedbackImage,
  FeedbackReport,
} from './types'

// assembles the one payload a report is made of. the fields are fixed here so
// every host sends the same shape, and so what is not in it is fixed too: no
// console logs, no authentication state, no device identifiers, and nothing the
// app did not already put on screen for the user who is looking at it.
export function buildFeedbackReport(input: {
  config: FeedbackConfig
  note: string
  annotation: FeedbackAnnotation
  image: FeedbackImage | null
  platform: string
  capturedAt?: string
}): FeedbackReport {
  const { config, note, annotation, image, platform } = input
  const route = config.resolveRoute?.() ?? { route: null, screen: null }
  return {
    note: note.trim(),
    mode: annotation.kind,
    annotation,
    route: route.route,
    screen: route.screen,
    app: config.app,
    platform,
    image,
    capturedAt: input.capturedAt ?? new Date().toISOString(),
  }
}

// a reader's one-line summary of where the annotation landed, in percentages of
// the captured surface so it reads the same on any device.
export function describeAnnotation(annotation: FeedbackAnnotation): string {
  if (annotation.kind === 'inspect') {
    const { x, y } = annotation.normalizedPoint
    const label = annotation.target?.text ?? annotation.target?.element
    const where = `${percent(x)}, ${percent(y)}`
    return label ? `${label} at ${where}` : `point at ${where}`
  }
  const closed = annotation.strokes.some((stroke) => stroke.closed)
  const count = annotation.strokes.length
  const shape = closed ? 'circled area' : 'marked area'
  return count > 1 ? `${shape} (${count} strokes)` : shape
}

function percent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}
