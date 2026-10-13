// ---------------------------------------------------------------------------
// the feedback capture contract
//
// one shape for "the user pointed at something on screen and said what is wrong
// with it", shared by every surface that captures an annotation. geometry is
// carried twice on purpose — window points, which the host measured and can
// draw, and the normalized 0..1 fraction of the captured surface, which is the
// only form that still means something after the report leaves the device and
// is read against an image of a different size.
//
// nothing here reaches a device capability. screen capture and any
// device-level activation arrive as injected contracts, so this module stays
// dependency-free and the platform decision stays open.
// ---------------------------------------------------------------------------

export type FeedbackPoint = { x: number; y: number }

export type FeedbackRect = { x: number; y: number; w: number; h: number }

// the surface the coordinates above were measured against. every normalized
// value in a report is a fraction of this, so a reader can place an annotation
// on an attached image without knowing the device.
export type FeedbackSurface = { width: number; height: number }

// a freehand mark reduced to the few points that describe its shape. `points`
// are window points on `surface`; `normalizedPoints` are the same path as
// fractions of it.
export type FeedbackStroke = {
  points: FeedbackPoint[]
  normalizedPoints: FeedbackPoint[]
  bounds: FeedbackRect
  normalizedBounds: FeedbackRect
  // true when the finger came back near where it started — a circled area
  // rather than an underline or an arrow.
  closed: boolean
  surface: FeedbackSurface
}

// whatever the host resolved under the tap. it stays optional: this package
// never inspects an app's component tree, so an unenriched point is the honest
// answer rather than a fabricated element identity.
export type FeedbackTarget = {
  element: string
  text?: string
  testID?: string
  role?: string
  component?: string
  source?: string
  rect?: FeedbackRect
  normalizedRect?: FeedbackRect
}

export type FeedbackInspectAnnotation = {
  kind: 'inspect'
  point: FeedbackPoint
  normalizedPoint: FeedbackPoint
  surface: FeedbackSurface
  target: FeedbackTarget | null
}

export type FeedbackDrawAnnotation = {
  kind: 'draw'
  strokes: FeedbackStroke[]
  surface: FeedbackSurface
}

export type FeedbackAnnotation = FeedbackInspectAnnotation | FeedbackDrawAnnotation

export type FeedbackImage = {
  // `data:image/<type>;base64,...`
  dataUri: string
  width: number
  height: number
}

// how a host attaches pixels. it is handed the surface the annotation was
// measured against, so the returned image shares that coordinate space and
// every normalized value lands where the user pointed.
//
// this package ships no implementation. a host that has no supported way to
// read its own window leaves it unset, and the report is still worth filing
// with a note and an annotation. it is called at exactly one moment — the
// instant an inspect tap or a draw stroke completes — and never on a timer,
// on launch, or in the background.
export type FeedbackImageCapture = (
  surface: FeedbackSurface,
) => Promise<FeedbackImage | null>

// who is reporting, as the app knows itself. this identity is descriptive and
// never authorizes or routes a report; the host transport owns that decision.
export type FeedbackAppIdentity = {
  id: string
  name: string
  version?: string
  build?: string
}

export type FeedbackReport = {
  note: string
  mode: 'inspect' | 'draw'
  annotation: FeedbackAnnotation
  // where the user was. a host with a router hands its current route here;
  // `screen` is the human-readable name a reader sees first.
  route: string | null
  screen: string | null
  app: FeedbackAppIdentity
  platform: string
  image: FeedbackImage | null
  capturedAt: string
}

export type FeedbackSubmitResult =
  | { ok: true; id?: string }
  | { ok: false; message: string }

export type FeedbackSubmit = (report: FeedbackReport) => Promise<FeedbackSubmitResult>

// ---------------------------------------------------------------------------
// configuration
//
// everything app-shaped enters here, so the feedback surface itself knows no
// route, endpoint, copy, project, or identity. `submit` is the whole delivery
// path: a host that needs headers, retries, or a different transport writes
// them once, there.
// ---------------------------------------------------------------------------

export type FeedbackConfig = {
  app: FeedbackAppIdentity
  submit: FeedbackSubmit
  // every activation path answers this. it defaults on, so an app that installs
  // the integration has feedback without configuring anything, and an app with
  // a user-facing switch flips this instead of unmounting the overlay.
  // availability is all it grants: nothing is captured or sent until the user
  // opens the overlay and presses send.
  enabled?: boolean
  // the route/screen the user is looking at, read at capture time.
  resolveRoute?: () => { route: string | null; screen: string | null }
  // injected pixel capture. unset means reports carry no image.
  captureImage?: FeedbackImageCapture
  // injected enrichment for an inspect tap. a host that already resolves its
  // own elements returns one here; returning null keeps the honest bare point.
  resolveTarget?: (
    point: FeedbackPoint,
    surface: FeedbackSurface,
  ) => Promise<FeedbackTarget | null>
}
