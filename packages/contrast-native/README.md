# contrast-native

`contrast-native` registers the native integrations shared by Contrast apps.
Import it from One's native setup file so registration finishes before route
modules render:

```ts
// setupNative.ts
import 'contrast-native'
```

Then point One at that file:

```ts
one({
  setupFile: {
    native: './setupNative.ts',
  },
})
```

The import enables Tamagui's Burnt toasts, linear gradients, gestures and sheet
gestures, keyboard controller, teleport portals, safe areas, and Expo UI menus.
It also imports `one`, which registers the native `Stack.Toolbar` implementation.
Without this setup import, `Stack.Toolbar` remains headless.

The base registration import has no configuration API. Every registration has
one starter-wide configuration, including Tamagui's standard gesture and sheet
support. The optional feedback subpath has its own host contract below.

Keep `one` in the app's dependencies. One owns its native packages and the
autolinking configuration that discovers them.

## in-app feedback

`contrast-native/feedback` is the visual feedback surface Contrast apps ship
with: the user points at something on screen, writes a sentence about it, and
sends one bounded report.

```ts
// setupNative.ts
import { withFeedback } from 'contrast-native/feedback/overlay'
import { configureFeedback } from 'contrast-native/feedback'
import { AppRegistry } from 'react-native'

configureFeedback({
  app: { id: 'feed', name: 'Feed' },
  submit: (report) => postFeedbackReport(report),
})

AppRegistry.setWrapperComponentProvider(() => withFeedback())
```

The overlay mounts through React Native's app wrapper so it draws above every
screen, including screens rendered by a nested runtime, and so the taps it takes
never reach the app underneath. React Native allows exactly one wrapper, so an
app that already has one composes rather than replaces it:
`withFeedback(ExistingWrapper)`.

### two entry points

`contrast-native/feedback` is the contract and its state, with no React Native
UI in the module graph, so a shared screen can import `openFeedback` on every
platform an app builds for. `contrast-native/feedback/overlay` is the native
overlay itself and is imported once, from the native setup file.

### activation

Three fingers down together opens the overlay from anywhere. The wrapper claims
only that gesture, leaving ordinary taps, scrolling, and navigation with the app
underneath. `openFeedback()` exposes the same entry point for visible product
controls; Contrast mobile also uses a long press on its persistent account
avatar and a row in settings. A device-level source such as a physical shake or
an operating-system screenshot notification becomes one more caller of
`openFeedback()` when its platform capability lands, never another branch inside
the overlay.

`enabled` defaults on, so installing the integration is what turns feedback on.
An app with a user-facing switch reconfigures with `enabled: false`, which makes
every trigger inert without unmounting anything.

### delivery

A generated app posts to its own server route. The device never receives a
Contrast project capability:

```ts
// app/api/feedback+api.ts
import { forwardContrastFeedback } from 'contrast-native/feedback/server'

export const POST = (request: Request) =>
  forwardContrastFeedback(request, {
    endpoint: process.env.CONTRAST_FEEDBACK_URL,
    token: process.env.CONTRAST_FEEDBACK_TOKEN,
  })
```

The helper bounds the JSON body, strips caller headers, and sends only the
server-injected project write capability. `app.id` is descriptive metadata; it
never authorizes or routes a report.

### the control

A rounded glass bar, docked to the top or bottom edge and thrown between them,
because it sits on top of the very thing the user is trying to point at. It uses
liquid glass where the platform has it and a rounded blur material everywhere
else, and a feathered blurred halo separates it from whatever the app happens to
be painting behind it. Its actions are Draw, Inspect, and Close.

Inspect consumes one tap and records where it landed. Draw takes one or more
freehand strokes, reduced to the few points that describe their shape. Both
capture through a full-screen layer, so a tap or a drag meant for the annotation
can never press the app control hidden underneath. Finishing either one expands
the bar into a composer with `Send us feedback`, Send, and Cancel.

### what leaves the device, and when

Availability is not permission to look. Nothing is read from the screen until
the user completes an inspect tap or a draw, and nothing is transmitted until
they press Send. A report carries the note, the mode, the annotation geometry,
the route and screen the host reports, the app identity the host configured, and
an image when the host supplied a capture. It carries no console logs, no
authentication state, no device identifiers, and nothing the app had not already
put on screen for the person looking at it. The composer says on its face
whether an image is included.

Geometry travels twice: window points, which the host measured, and the same
values normalized against the surface they were measured on. Only the normalized
form still means anything once the report has left the device, because the
reader has an image of some other size.

### injected capture

The package takes no screenshot itself. `captureImage` is a host-supplied
function handed the surface the annotation was measured against, so the image it
returns shares that coordinate space. Returning `null` is a first-class answer,
and an app with no supported way to read its own window simply leaves it unset.

### the shared controller

`feedbackReducer` is the arm → capture → compose → send state machine, generic
over whatever a surface calls a capture. Any surface in an app that annotates
and then composes should use it rather than growing a second set of rules about
when a capture may land, when typed text survives a re-capture, and when a
second send is possible.
