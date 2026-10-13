# takeout-ui

Interaction patterns above Tamagui. Not a component library: every export here
is a composition that is expensive to get right and easy to get subtly wrong
when it is copied between apps.

## target patterns

`takeout-ui` owns reusable interactions that an app should not reassemble. A
plain Tamagui control stays in Tamagui; an app-specific layout stays in the app.
Each interaction has one public contract and one entry path per platform. A
native leg may hand a case to the Tamagui presentation when One cannot express
it, as the confirmation alert does for typed confirmation. Keep platform
differences behind a stable entry file, as `forms/Form.tsx` and
`forms/FormImpl.ios.tsx` do. The package export names the entry file, never a
file with `.ios` or `.android` siblings. A leg reached only on web carries no
native branches. Remove old implementations and options when a replacement
covers their callers.

On iOS, use One's native control for system chrome that One exposes and this
package owns, including alerts, form rows, pickers, toggles, and menus. `Form`
is a whole native form, since its sections and rows need the same SwiftUI
parent. A native Form sits outside `One.iOS.Host` and outside a ScrollView.
Keep its React contract shared with the Tamagui leg and map props at that
boundary. Navigation and toolbars belong to the app's router layout, where
One requires their parent. On Android, use One's native control when it owns
the complete interaction; otherwise use the Tamagui leg. Where One exposes
the control, do not draw a lookalike or add a second native dependency. Where
it does not, use measured platform geometry for system chrome, including the
web tab bar and Android dropdown.

On web, a form row's visible label is also the control's accessible name.
Keep that binding inside `Field`, `DateField`, and `ToggleField` so every app
gets the same semantic control.

For kit-owned styling, use Tamagui v3 `styled()` with semantic variants,
configured theme roles, and flat conditional values. Derive a value-driven
variant with `styled.dynamic`. An explicit prop outranks a variant whatever
their order, and an explicit `undefined` still clears the value, so a style a
variant owns is never also passed as a prop on the same element. Derive public props from `GetProps` for a
Tamagui-only control; a multi-platform interaction keeps its shared contract
in its `*Contract.ts` file. Use the consumer's configured size ladder and
paired text metrics for kit controls. Measured OS geometry is separate from
that ladder. State, theme, media, and platform conditions belong in Tamagui
values when they can express the behavior; use a platform file for a genuinely
different native control or lifecycle. Use a theme role on Tamagui surfaces
and resolve it once at a native prop boundary when One needs a concrete color.
Keep the OS material name when One owns the material.

The kit runs in each consumer's Tamagui config. Supported configs provide
`styleValueSyntax: 'string'`, the v6-builder theme roles used by these
components, their named transitions (`quickLessBouncy`, `quickest`, `medium`,
`lazy`), and the size tokens they consume. Check the target app's config
before using another key. A syntax migration preserves the app's current
measurements; changing a token or swapping to native chrome is a visual change
until captures prove otherwise in every affected config.

`GlobalOverlayProvider` remains the one owner of Tamagui overlay order. Native
One presentations follow the OS order outside that host. A native replacement
must preserve the interaction's open-state reporting and dismissal behavior;
it does not mount a second Tamagui host. Keep one route-sheet declaration and
one form-sheet body per flow. Avoid extra wrappers whose only job is
forwarding Tamagui props.

For a behavior-preserving refactor, capture the same real screen before and
after at the same viewport, theme, route, and interaction state, inspect a
side-by-side image, and run the narrowest check for the changed contract.
Check both themes when styling changes and each affected config family. Capture
native screens when changing a native leg. Before deleting an export, search
the app for its callers. Land a refactor only when its comparison shows no
visible change.

The package includes overlays, forms, navigation, and icons:

| import | what it owns |
| --- | --- |
| `takeout-ui/overlay` | `GlobalOverlayProvider`, one mounted host for every overlay below |
| `takeout-ui/dialog/Dialog` | adaptive `Dialog`: a bottom sheet on phones and mobile web, a centered dialog on wide screens, with header, scrolling body, footer, actions, close, and sizes |
| `takeout-ui/dialog/confirm` | queued `dialogConfirm` and `ensureConfirmed`; the overlay provider mounts the host |
| `takeout-ui/toast/Toast` | `ToastProvider`, `showToast`, and `hideToast`, with native OS presentation on mobile |
| `takeout-ui/dialog/DialogHost` | `HostedDialog` plus the registration host that adapts a dialog to the app's sheet presentation at its configured breakpoint |
| `takeout-ui/sheet/Sheet` | the sheet registration and its `Frame`/`Overlay`/`ScrollView` parts |
| `takeout-ui/sheet/routeSheetOptions` | `formSheetOptions()`, the one declaration a layout spreads to present a route as a sheet on every platform |
| `takeout-ui/sheet/RouteSheet` | the web presentation `<Presentations web={{ sheet: RouteSheet }}>` mounts for those routes |
| `takeout-ui/forms/FormSheetBody` | `FormSheetFrame` and `FormSheetBody`, the sheet body each platform presents in its own sheet |
| `takeout-ui/popover/Popover` | one global popover root and the trigger that registers into it |
| `takeout-ui/tooltip/Tooltip` | `Tooltip` and `GlobalTooltipProvider`; the bus is exported from `takeout-ui/tooltip/tooltipBus` and `wrapWithTooltip` from `takeout-ui/tooltip/tooltipHelpers` |
| `takeout-ui/overlay/overlayOpenBus` | who currently holds an overlay open, so tooltips and app chrome can react |
| `takeout-ui/keyboard/escape` | the escape key stack every dismissible layer registers into; a no-op off web |
| `takeout-ui/forms/Input` | `Input`, the text field with the kit's one focus ring and `size="xs" | "sm" | "md" | "lg" | "xl"` |
| `takeout-ui/forms/TextArea` | `TextArea`, the multi-line field with the same border, focus ring, and sizes |
| `takeout-ui/buttons/Button` | `Button`, the app button every template re-exports as `interface/buttons/Button`: `accent`, `subtle`, and `glass` (a capsule, or a circle when square, floating on the kit's glass), plus `ButtonGroup`, glass buttons that share one capsule the way a toolbar groups its items |
| `takeout-ui/glass/GlassView` | `GlassView`, the kit's glass: the system material on iOS, a blur under the theme's wash on Android, and a translucent fill over backdrop blur with a lit rim on web |
| `takeout-ui/select/Select` | a data-driven `Select` that adapts into a sheet on phones |
| `takeout-ui/tabs/Tabs` | styled `Tabs` with an animated indicator, plus `SimpleTab` |
| `takeout-ui/tabs/MobileTabBar` | the phone-width web tab bar drawn as the iOS 27 UITabBar: a glass pill of tabs and an optional trailing action circle |
| `takeout-ui/lists/VirtualList` | `VirtualList` for long or unbounded lists (a feed anchored at the start, a chat or log anchored at the end) and `VirtualRow`: native VirtualView empties off-screen rows, the browser skips them with content-visibility, and only a window of rows near the anchor mounts |
| `takeout-ui/image/Image` | `Image`, one image primitive taking a web-aligned `src`: Tamagui `Image` on web, `One.UI.Image` through `createImage` on native, where a root-relative `src` resolves against the app server (`getURL()`) |
| `takeout-ui/lists/SwipeableRow` | `SwipeableRow`, trailing swipe actions on a list row: react-native-gesture-handler's ReanimatedSwipeable on native, the row alone on web |
| `takeout-ui/provider/AppProvider` | `AppProvider`, the one root an app mounts: native roots, the Tamagui theme (system light or dark, or a pinned `defaultTheme`), the global overlay host, web route sheets and the toast host. `AppThemeProvider` is the theme alone |
| `takeout-ui/keyboard/KeyboardLayoutFrame` | `KeyboardAvoidingFrame`, `KeyboardStickyFrame`, `dismissKeyboard`: react-native-keyboard-controller on native, plain containers and a focus blur on web |
| `takeout-ui/platform/PlatformSpecificRootProvider` | the app root native needs (gesture handler root, keyboard provider, teleport portal host); a passthrough on web |
| `takeout-ui/menu/Menu` | `GlobalMenuProvider` and `Menu.Trigger`, one menu built from an entry array |
| `takeout-ui/icons/phosphor/*` | the kit's own chrome: the carets and check `Select`, `Menu` and `Form` draw themselves with, not an icon set for an app |
| `takeout-ui/icons/types` | `IconProps` and `IconComponent`, the one icon prop contract both kits use |
| `takeout-ui/icons/getIconSize` | resolves an icon `size` token to the number an svg paints with |

## import paths

Import each part from its own path, as the table lists. A specific UI
component gets a path export in `package.json`, so an app that renders it can
find it by the path it names. The root barrel remains for consumers of the
existing public import; in-repo callers use paths. New components do not enter
the barrel.

## setup in an app

The app declares `"takeout-ui": "file:packages/takeout-ui"` beside
`takeout-native`. Mount the provider once in `app/_layout.tsx`, and
import the parts where they are used:

```tsx
import { GlobalOverlayProvider } from 'takeout-ui/overlay'

<GlobalOverlayProvider dialogSheetBreakpoint="max-md">
  <AppRoutes />
</GlobalOverlayProvider>
```

```tsx
import { Dialog } from 'takeout-ui/dialog/Dialog'

<Dialog open={open} onOpenChange={setOpen} minH={360}>
  <Dialog.Header title="Edit collection" description="Update the saved details." />
  <Dialog.Body>{fields}</Dialog.Body>
  <Dialog.Footer>
    <Dialog.Close asChild>
      <Button>Cancel</Button>
    </Dialog.Close>
    <Dialog.Action tone="confirm" onPress={save}>Save</Dialog.Action>
  </Dialog.Footer>
</Dialog>
```

The compile CDN publishes it like every other `workspace:*` platform package:
`bun scripts/ops/compile-catalog-set.ts --missing` lists it until the push
after a change lands, and ejected projects vendor it as `file:` source.

## the one-host rule

Dialogs, sheets, popovers, and tooltips do not mount an instance per call site.
Each call site registers into the single host that `GlobalOverlayProvider`
mounts, and the host renders whichever registration wins on priority then
sequence. That is what keeps a stack of overlays from fighting over focus,
z-index, and scroll locking, and it is why an app mounts the provider once at
its root.

Sizing is a named variant (`sheetVariant="fit-content" | "compact" | "medium" |
"large" | "full-height"`), never raw snap points forwarded from a call site.
`GlobalOverlayProvider` defaults to the `InsetDialogSheetContent` at `max-sm`:
a semantic background card with rounded corners and a shadow that floats 12px in from
every window edge. `dialogSheetInset` picks the other common style: `false` is
an edge-to-edge bottom sheet with rounded top corners, and a number is the
inset in px. Native apps can pass `dialogSheetContent`, a component rendered
inside the host-owned direct `Sheet.Container`, to use their own material and
scrolling while the host keeps the required direct `Sheet.Overlay` and
`Sheet.Container` slots. Pass
`dialogSheetBreakpoint={false}` where dialogs should stay centered at every
width, such as a shell whose window is phone-shaped.

## route sheets

A create, edit, or quick-entry flow is a route file declared with
`formSheetOptions()` from `takeout-ui/sheet/routeSheetOptions`, rendering
`FormSheetFrame` or `FormSheetBody`. One declaration and one body: the layout
and the screen are identical on every platform.

- iOS presents the native form sheet, and the frame draws the system material
  over the presenting screen.
- Android presents the route as a transparent modal with no system animation,
  and the frame draws the product's own sheet: the same overlay, container, and
  drag-to-dismiss the web route sheet uses, at the 50% and 92% detents.
- Web presents it through One's `<Presentations web={{ sheet: RouteSheet }}>`:
  a bottom sheet at phone width, a centered card on desktop.

`formSheetOptions({ initialDetent, undimmed })` shapes the iOS system sheet and
the web sheet. Android's sheet is the Tamagui one and opens at the half detent.

## dialogs and notifications

`Dialog` exposes `Header` (`title`, `description`, `hidden`), `Title`,
`Description`, `Body`, `Footer`, `Action`, and `Close`. Use `Body` for scrolling
content so the header and footer stay visible; `minH` and `minW` size the
centered dialog and the sheet's minimum height. Action
buttons accept `tone="default" | "confirm" | "destroy"`. Named sizes range
from `compact` through `fill`; `contentInset="none"` supports working surfaces.
`autoFocusFirstField={false}` keeps read-only dialogs from focusing a field.
Escape in a filled text field blurs it first, then dismisses on the next press.

`dialogConfirm({ title, description, destructive, confirmLabel, cancelLabel,
extraConfirm })` queues a boolean confirmation. `extraConfirm` requires typing
`Confirm`. Cancellation resolves `false`; `ensureConfirmed` instead throws
`AbortError`. `GlobalOverlayProvider` mounts this host automatically. Calls
without a mounted host reject instead of leaving a pending promise forever.
iOS asks with the system alert and Android with the Material alert dialog, where
back and an outside tap cancel; web and a typed `extraConfirm` use the shared
dialog. Material's alert has no destructive button, so an Android confirm without
`extraConfirm` ignores `destructive`.

Mount `ToastProvider` once, then call `showToast(title, { type, message,
duration })` or `hideToast()`. Types include `info`, `warn`, and `error`;
`success` and `warning`, actions, stable IDs, and dismissal callbacks are also
supported. Native presentation uses the kit's glass card, with One's glass on
iOS and One's blur under a theme wash on Android.

## select

`Select` takes its options as data, so a call site cannot forget the item index
Tamagui needs for keyboard navigation. It is uncontrolled until you pass
`value`, starting from `defaultValue` or else the first item, read once at
mount; every leg shares that state through `select/useSelectValue.ts`. An id
that matches no item shows `Select` plus the field label on web, docks the
label inside the Android field, and shows `None` in the iOS picker. Below
`sheetBreakpoint` (default `max-sm`) the options adapt into a sheet, which is
the only usable presentation on a phone; pass
`sheetBreakpoint={false}` to keep the popover at every width.

```tsx
import { Select } from 'takeout-ui/select/Select'

<Select
  items={[
    { id: 'draft', name: 'Draft' },
    { id: 'ready', name: 'Ready', icon: <CheckIcon size={14} /> },
  ]}
  value={status}
  onValueChange={setStatus}
  width={200}
/>
```

## tabs

`Tabs` takes the tab row as data and renders the panes as children. The active
and hovered indicators animate between tabs from the layouts Tamagui reports;
`variant="underline"` swaps the pill for a rule under the label. Arrow keys move
between tabs and Enter selects, because `activationMode` is `manual`.

```tsx
import { Tabs } from 'takeout-ui/tabs/Tabs'

<Tabs
  tabs={[
    { label: 'Overview', value: 'overview' },
    { label: 'Files', value: 'files', Icon: FolderIcon },
  ]}
  value={tab}
  onValueChange={setTab}
>
  <Tabs.Content value="overview">…</Tabs.Content>
  <Tabs.Content value="files">…</Tabs.Content>
</Tabs>
```

`alwaysVisibleContent` keeps every tab's subtree mounted on web, so scroll
position, focus, and component state survive a switch; the inactive panes leave
the flow so the visible one still sizes the container. Native mounts only the
active pane, where an offscreen tree costs more than the state it preserves.
Add `fitContent` where the tabs sit in an auto-height surface such as an adapted
sheet, so the content sizes to what it holds instead of filling its parent.

`SimpleTab` is the plain text tab for rows that carry no indicator, such as a
segmented filter inside a toolbar.

## mobile tab bar

`MobileTabBar` is the web bottom bar for phone widths, a drawing of the iOS 27
UITabBar with every number read off UIKit: icon-plus-label tabs in a liquid
glass pill, a glass lens under the selected tab, and the optional action as its
own glass circle trailing the pill (the iOS prominent tab). Without an action
the pill centers. It is fixed to the bottom of the window and hides at `md`,
where desktop navigation takes over.

```tsx
import { MobileTabBar } from 'takeout-ui/tabs/MobileTabBar'

<MobileTabBar
  tabs={[{ name: 'feed', label: 'Feed', href: '/home/feed', icon: HomeIcon }]}
  action={{ label: 'Create', href: '/home/feed', onPress: openComposer, icon: PlusIcon, testID: 'feed-primary-action' }}
  onLayout={(event) => setTabBarHeight(event.nativeEvent.layout.height)}
/>
```

`tint` sets the selected tab's color (the accent by default) and `hiddenFrom`
moves or removes the breakpoint (`'md'`, `'sm'`, or `false`). The glass,
geometry, and type are UIKit's and take no props. The selected tab is the one
whose `href` prefixes the current path. Publish the height from `onLayout` so
scrollers can clear the fixed bar. In this app, the tabs and the action are
declared in `features/app/tabs.ts` and `features/app/tabAction.ts`.

## menus

A menu is an array of entries rather than children, so the same array can be
handed to a trigger or nested as a submenu. Mount `GlobalMenuProvider` once at
the app root: every trigger publishes into that one menu, so only one is ever
open and the open one is the last trigger that asked for it. Escape closes it
through `takeout-ui/keyboard/escape`, which also stops the layer beneath from
answering the same press.

```tsx
import { GlobalMenuProvider, Menu, type MenuEntry } from 'takeout-ui/menu/Menu'

const entries: MenuEntry[] = [
  { type: 'title', text: 'Project' },
  { text: 'Rename', icon: PencilIcon, action: rename },
  { text: 'Open recent', items: [{ text: 'notes', action: openNotes }] },
  { type: 'separator' },
  { text: 'Word wrap', type: 'checkbox', checked: wrap, preventClose: true, action: toggleWrap },
  { text: 'Delete', destructive: true, description: 'Cannot be undone', action: remove },
]

<Menu.Trigger items={entries}>
  <Button>File</Button>
</Menu.Trigger>
```

An entry is an item, a `separator`, or a `title`. An item's `type` of `radio` or
`checkbox` draws an indicator in place of its icon, `destructive` themes it red,
`disabled` dims it and refuses the action, `preventClose` leaves the menu open
after a selection, and a non-empty `items` makes it a submenu. `icon` takes
either a rendered element or a component the row sizes itself. Wrap sibling
triggers in `Menu.Group` to let a hover switch the open menu between them.

On iOS and Android the trigger opens the system menu through `One.iOS.Menu`
and `One.Android.Menu`, with the same actions, checks, submenus, disabled
state, and separators. A system menu item carries an SF Symbol name rather
than a view, so on iOS only an `sfSymbol(...)` icon shows; a title heads an
iOS menu section, and a destructive item turns red there. A description
reaches iOS as accessibility help, not a visible subtitle, and `right` does not
render. Android's popup draws no icons, titles, separators, or destructive
color, and closes on every selection. One reports only selections, so
`onOpenChange` fires on web only. Each dropped detail warns once in dev.

## forms

`Input` and `TextArea` are styled Tamagui fields with one border, background,
placeholder color, and focus treatment: a soft two pixel outline ring plus a
stronger border, replacing the browser's default ring on web and doing nothing
layout-affecting on native. `size="xs" | "sm" | "md" | "lg" | "xl"` sets radius,
font size, and height. Apps import them instead of the raw Tamagui fields so
every form in a project focuses the same way.
