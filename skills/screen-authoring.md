---
name: Screen authoring
description: Recipe for authoring and registering tab screens, sheets, dialogs, and sample content.
---

# Screen authoring

Create and edit forms use route sheets. Use `add.tsx` for the tab action;
a row action may pass its record id to the same route. If that route serves
different form modes, validate every required visible field for the active
mode. Declare each sheet in `_layout.tsx` with `formSheetOptions`.

Follow this bounded pass when adding a screen:

1. Read every routed skill before touching code.
2. Read the lane-written `_layout.tsx`, `features/app/routes.ts`,
   `features/app/tabs.ts`, and existing OWNS files in parallel. Read
   `interface/dialogs/SheetScreen.tsx` only for a sheet. Do not read uncreated
   leaves, shared primitives, themes, or starter layouts.
3. Verify the lane-written route constant, tab entry, and titled layout in
   `branch_diff`; never re-register. Add the section 1 `add` screen only for a
   sheet. Write the layout and every screen it names in one response with
   parallel calls: a layout
   written alone stays red until its screens exist. If a lane-written hunk is
   missing, include it with the leaf writes and name it in the submit summary.
   Keep fixtures local.
4. Submit the first type-clean edit. Submit navigates to the owned leaf and
   waits for its declared testID; do not navigate, wait, tap, or inspect before
   that. If returned, fix only the named issue. QA and Bind own sheet use.

Do not inspect themes, shared primitives, icon catalogs, other packages, or
`tamagui_config_inspect`; Section 0's contract and import lines are exact. `rg`
`/node_modules/contrast-ui` only for a name this skill does not give. Change
those owners only when named in OWNS.

The concrete file shapes and API contracts are below.

## 0. Bounded config and primitive contract
Consume the template's pre-bound design-system and component contract directly.

### Theme colors and meters
- Theme colors come in pairs; a surface and the text on it always use the same pair:
  - Page and cards: `bg="background"` with `color="color"`, outlined by `borderColor="border-color"`.
  - Accent: `bg="accent-background"` is the solid brand fill (a primary button, a hero card, a meter's fill on a card) and `color="accent-color"` is the text and icon color that reads on it. Never put `color="color"` on an accent surface. On an accent surface a meter's track and fill are both `accent-color`, the track faded, as below.
  - Warning: an over-limit fill is `bg="red-600"`. Warning text and icons sit in `theme="red"` with `color="color"`, which reads on light and dark cards; `red-600` is a fixed palette color and is never text.
  - Neutral scale `color-1` to `color-12`, light to strong: `bg="color-2"` or `bg="color-3"` for a muted surface or an empty meter track, `color="color-10"` or `color="color-11"` for secondary text.
  - A meter is a clipped track with its fill inside. Opacity on the track would fade the fill too, so a faded track is its own layer:
    ```tsx
    {/* on a card: neutral track, accent fill */}
    <YStack h={8} rounded="10" overflow="hidden" bg="color-3">
      <YStack h="100%" w={`${width * 100}%`} bg="accent-background" />
    </YStack>
    {/* on an accent surface: faded accent-color track, solid accent-color fill */}
    <YStack h={8} rounded="10" overflow="hidden">
      <YStack position="absolute" t={0} b={0} l={0} r={0} bg="accent-color" opacity={0.3} />
      <YStack h="100%" w={`${width * 100}%`} bg="accent-color" />
    </YStack>
    ```

### Summary charts
- A screen that summarizes quantities (spent against limits, progress toward goals, activity over a period) leads with one designed chart drawn from its live data, most of all the screen the app opens to. Use a ring or arc for a share of a whole (below) and an area or bar series for a period. Make it the screen's centerpiece, with the key figure set inside or beside it and its parts labeled. A figure above rows of thin meters is not a chart.

### Rings
- A ring is the radial form of a meter: an `Svg` square with a full-circle track and a progress arc. Resolve both colors at the component boundary like `Sparkline` does (`theme['<token>'].get()` — svg props bypass token resolution, so never pass a token name to a fill or stroke):
    ```tsx
    import { useTheme } from 'tamagui'
    import { Circle, Svg } from 'react-native-svg'

    const theme = useTheme()
    const track = theme['color-3']
    const fill = theme['accent-background']
    if (!track || !fill) throw new Error('ring meter requires theme colors')
    const r = (64 - 8) / 2
    const c = 2 * Math.PI * r
    <Svg role="img" aria-label="..." width={64} height={64} viewBox="0 0 64 64">
      <Circle cx={32} cy={32} r={r} stroke={track.get()} strokeWidth={8} fill="none" />
      <Circle cx={32} cy={32} r={r} stroke={fill.get()} strokeWidth={8} fill="none"
        strokeDasharray={`${c * width} ${c}`} strokeLinecap="round"
        transform="rotate(-90 32 32)" />
    </Svg>
    ```
    Draw the progress arc as a complete `Circle` whose dash length is the filled fraction; a path whose start equals end does not render a closed arc.
    On an accent surface the ring follows the meter rule: both circles use `accent-color`, the track at `strokeOpacity={0.3}`. An `accent-background` arc on an accent card is invisible.

### Record lists
- A screen's records are one `RecordList` of `RecordRow`s from `~/interface/lists/RecordList`, never a bordered card per record. It draws iOS's inset-grouped list on iOS and the grouped card on Android and web.
  ```tsx
  <RecordList title="<Section>" testID="<name>-list">
    {records.map((record) => (
      <RecordRow key={record.id} title={record.name} subtitle={record.detail} checked={record.done} onCheckedChange={() => toggle(record.id)} onPress={() => router.push(`${APP_<NAME>_HREF}/add?id=${record.id}`)} testID={`<name>-${record.id}`} />
    ))}
  </RecordList>
  ```
- A record's one done state is `checked` with `onCheckedChange`: the row draws the platform's check control, never a "Done" text button. A trailing figure is `value`, a leading icon is `leading`, and `onPress` opens the record's sheet (section 5).

### Status derivation
- Status derivation behind a meter or ring lives in the shared data contract's `statusRules`, never the screen. Each rule returns one `StatusDerivation`: `state` is the derived status id, `ratio` the true unclamped value (`1.2` when 20% over), and `width` the fill clamped to 0..1. A record with no limit returns its own `state` and no `width`: it shows no meter and no "of" amount, only what it holds. The fill reads `width`, any progress text reads `ratio`, and `state` picks the spec's semantic state treatment, over-limit included; the screen calls `statusRules.<id>(record)` for every meter and never compares amounts itself.

### Spacing, syntax, and shorthands
- Spacing, padding, and radius: flat numeric token strings (`p="4"`, `gap="3"`, `rounded="4"`). A bare number is raw pixels, for an exact dimension such as a meter's `h={8}`. A control's `size` is a named size (`xs` | `sm` | `md` | `lg` | `xl`), never a numeric token; an unrecognized name silently renders the default.
- Syntax: flat strings (`styleValueSyntax: 'string'`).
- Layout and flex: use standard `flex={1}` (never shorthand `f={1}`), `w="100%"`, `h="100%"`.
- The only shorthands: `bg`, `p` `px` `py` `pt` `pb` `pl` `pr`, `m` `mx` `my` `mt` `mb` `ml` `mr`, `w` `h` `minW` `minH` `maxW` `maxH`, `t` `b` `l` `r` `z`, `rounded`, `items`, `justify`, `content`, `self`, `grow`, `shrink`, `text`, `select`. Everything else is the full React Native name: `borderWidth={1}`, `borderBottomWidth={1}`, `borderColor="border-color"`, `flexWrap="wrap"`, `position="absolute"`. `borderW`, `borderB`, `bw`, `br`, `ai`, `jc`, `f` do not exist.

### Text
- Text: `SizableText` from `'tamagui'` with `size="1"` to `"9"` and `fontWeight`; `fontFamily="heading"` for a title.

### Money and dates
- Display helpers: `import { centsFromInput, formatCents, formatDateOnly, formatRelativeDate, formatShortDate, todayDateOnly, type DateOnlyKey } from 'contrast-ui/display'`.
- Money: store integer cents. `formatCents(cents, currency?, locale?)` formats cents as text; `centsFromInput(text)` parses an entered amount into integer cents or `null`; `<CurrencyAmount cents={valueCents} currency="USD" size="6" />` from `~/interface/text/CurrencyAmount` renders cents. Paired amounts (`X of Y`) use the same formatter on both sides. On compact cards they stack vertically or wrap with `flexWrap="wrap"`, `minW={0}`, and `shrink={1}` on each amount so they fit at 320pt; never use one unwrapped row of two full amounts plus a joiner. Never divide by 100 in a screen or concatenate a currency symbol.
- Dates: a calendar day is a `DateOnlyKey` (`YYYY-MM-DD`): a new one defaults to `todayDateOnly()`, never a hand-built string, and renders through `formatDateOnly(key)`; a timestamp renders through `formatShortDate(ms)` or `formatRelativeDate(ms)`. A month label comes from the same `monthModel` as the filter bounds. Never render a raw key, an ISO string, or `Date.toString()` in the interface.

### Fields
- Fields: a form body is `import { Field, Form, Section } from 'contrast-ui/forms/Form'` as `<Form presentation="sheet"><Section plain>...</Section></Form>`; a labeled text entry is `Field` (`label`, `value`, `onChangeText`, `placeholder`, `keyboardType`, `testID`); a calendar day is `import { DateField } from 'contrast-ui/forms/DateField'` (`label`, `value` as the date-only key, `onChange`); a choice is `import { Select } from 'contrast-ui/select/Select'` (a required `label`, `items={[{ id, name }]}`, `value={id}` or the empty value before a pick, `onValueChange`; no `placeholder`). `Input` takes no `label` prop; bare `Input` from `contrast-ui/forms/Input` is for entry outside a form, such as search. Picker items come from `choiceCatalog` in `data/catalog.ts` (`Object.entries(choiceCatalog.<set>).map(([id, name]) => ({ id, name }))`), never a per-screen list. Never a plain text input for a date.

### Layout, controls, and icons
- Layout container: `import { PageScrollView } from '~/interface/layout/PageScrollView'` wraps scrollable screen content (`<PageScrollView p="4" gap="4">...</PageScrollView>`).
- Controls: `import { Button } from '~/interface/buttons/Button'`. Boolean props `accent`, `glass`, `subtle` (`<Button accent>`; the only `variant` values are Tamagui's `outlined` and `quiet`), `disabled` (dims and blocks presses), sizes `xs` | `sm` | `md` | `lg` | `xl` (default `md`).
- Icons: `import { Icons } from '~/interface/icons'` holds only the template's generic set. For any other glyph, such as a category, `icon_search` returns exact names and `icon_add` adds them to `Icons`; never render an `Icons` key you have not seen there or added.

## 1. Route folder and files
The leaf folder under `app/home/(tabs)/<name>/` already holds the
lane-written `_layout.tsx`: a Stack whose `index` title is the tab label, used
as pushed screens' back label. The bar itself is untitled and transparent,
holding only the settings gear; `PageScrollView` keeps content below it.
- `_layout.tsx`: leave it alone, unless the screen has a sheet (section 5):
  then add the `add` screen and keep the `index` title:
  ```tsx
  import { formSheetOptions } from 'contrast-ui/sheet/routeSheetOptions'
  import { Stack } from 'one'

  export const unstable_settings = { initialRouteName: 'index' }

  export default function ScreenLayout() {
    return (
      <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: '<Tab label>', headerTitle: '', headerShown: true, headerTransparent: true }} />
        <Stack.Screen name="add" options={formSheetOptions({ initialDetent: 'full' })} />
      </Stack>
    )
  }
  ```
- `index.tsx`: The screen component. Copy the task contract's `testID` string exactly onto the headline: the first element carrying the screen's own information, such as its summary figure or first section heading. On native the tab bar names the screen and the top bar stays untitled, so add no screen title there. On web, show the route title in the screen content. The product declaration waits for the exact testID, so never rename it or invent a sibling id.
  Every tab root, the primary one included, mounts `<AccountToolbarButton />` from `~/features/account/AccountToolbarButton` as the first child of its content; it puts the Settings gear in the native bar and renders nothing on web.

## 2. Route constants
The lane already added this screen's constants to `features/app/routes.ts`:
verify them in `branch_diff` and never replace or remove an existing constant.
The hunks below are the fallback if one is missing (step 3):
- The constants, inserted before the `APP_HOME_HREF` line with that line kept
  in the new text:
  ```ts
  // oldText
  export const APP_HOME_HREF = APP_FEED_HREF
  // newText
  export const APP_<NAME>_ROUTE_NAME = '<name>'
  export const APP_<NAME>_HREF = '/home/<name>' satisfies Href
  export const APP_HOME_HREF = APP_FEED_HREF
  ```
- When this screen is the landing screen, a second hunk in the same call makes
  that line `export const APP_HOME_HREF = APP_<NAME>_HREF`.

## 3. Tab registration
The lane already added this screen's entry to `APP_TABS` in
`features/app/tabs.ts`: verify it in `branch_diff`. The entry below is what the
lane wrote, and the fallback if it is missing (step 3). Array order is tab bar
order: the landing screen at index 0, every other screen after the last entry:
  ```ts
  {
    name: APP_<NAME>_ROUTE_NAME,
    label: '<Label>',
    href: APP_<NAME>_HREF,
    icon: <Icon>,
    sfSymbol: '<sf-symbol>',
    sfSymbolFocused: '<sf-symbol-fill>',
    materialSymbol: '<material-symbol>',
  }
  ```
  Import the `icon` drawing from `~/interface/icons/lucide/<Icon>`; add a missing one with `icon_search` then `icon_add`, which generates that file.

## 4. Persistent chrome
`app/home/(tabs)/_layout.tsx`, `app/home/(tabs)/_layout.native.tsx`, and `features/app/MainHeader.tsx` render `APP_TABS` and the focused tab's action (section 5) automatically. Never edit or restructure them to add a screen or change an action.

## 5. Sheets and dialogs
Forms live in route files declared in `_layout.tsx` (section 1). Use `add.tsx` for the tab action; row actions may open `/add?id=<record id>`. If fields differ by mode, validate each mode separately. iOS uses the native form sheet; Android and web use the `contrast-ui` sheet. Never mount a form with inline `Dialog`, `@tamagui/sheet`, or raw Tamagui primitives.
- The tab bar opens it, never a button on the screen: `index.tsx` declares it as its tab's action, drawn as the circle beside the tab bar on native and web and as the desktop header button, with `testID="<name>-primary-action"` (`<name>` is the tab name), an id only the tab bar carries:
  ```tsx
  // useTabAction from '~/features/app/tabAction', Plus from '~/interface/icons/lucide/Plus'
  useTabAction(APP_<NAME>_ROUTE_NAME, { label: '<Add thing>', href: `${APP_<NAME>_HREF}/add`, icon: Plus, sfSymbol: 'plus', materialSymbol: 'add' })
  ```
  The screen draws no second button for it; a control acting on one record stays on that record's row.
- A sheet that acts on one of several records takes its target from the trigger (`/add?id=<record id>`, read with `useLocalSearchParams` from `'one'`). If that form also opens without a record, it shows a picker field for the target instead of silently using the first record.
- Each route sheet writes only its own fields inside `SheetScreen`, which owns the frame, title, close, scrolling, and the one primary action. A disabled action names its reason at the control on both surfaces:
  ```tsx
  import { useRouter } from 'one'
  import { SheetScreen } from '~/interface/dialogs/SheetScreen'

  export default function AddSheet() {
    const router = useRouter()
    return (
      <SheetScreen
        title="..."
        testID="<sheet-testid>"
        action={{ label: '...', testID: '<save-testid>', disabled: !valid, disabledReason: valid ? undefined : 'Add a title to save', onPress: () => { save(); router.back() } }}
      >
        ...fields
      </SheetScreen>
    )
  }
  ```

## 6. Sample content
Keep fixtures in one named constant such as `SAMPLE_DATA` for Bind to replace with live queries. For a declared choice set on this route, store machine ids and render labels through `choiceCatalog` from `~/data/catalog`; never copy labels into the screen. Import the catalog even before it merges: main supplies it before submit. Submit rejects per-screen choice labels. Display the catalog label, never the stored id. A screen outside a set's routes shows no labels from it.
