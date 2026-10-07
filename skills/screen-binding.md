---
name: Screen binding
description: Bind an app screen leaf to live data, including form controls, presentation, display values, and image uploads.
---

# Screen binding

This recipe applies when an implementation task owns an `app/` screen leaf. Keep
the merged Design composition and testIDs; replace its fixtures with the owned
query and mutation. Read the owned leaf and data namespace together. The APIs
below are already provided by this template; do not search primitive sources
or unrelated starter screens to rediscover them.

For each live meter, call `statusRules.<id>(record)` from `~/data/catalog`;
replace the Design fixture's local ratio and fill logic. One `width` check
wraps both the meter and the "of <limit>" text: a row without a limit shows only
the amount it holds. The fill reads `width` and progress text reads `ratio`.
Style from `state`: an over-limit fill is `red-600` and its text sits in
`theme="red"` with `color="color"` (`red-600` text disappears on dark cards);
ordinary progress uses the accent. Keep the Design's meter and ring colors: on an
accent surface both track and fill are `accent-color`, the track faded
(`strokeOpacity={0.3}` on a ring); on a card the track is `color-3` and the fill
`accent-background`. An `accent-background` arc on an accent card is invisible.

A figure another screen also shows (a total, a remaining amount, a count) must
match it: read that screen's leaf on main and reuse its computation over the
same rows. The same label never shows two numbers. A total covers every record
the other screen counts, including records without a limit, unless its label
says otherwise.

## Query state

- `const [rows, { type }] = useQuery(queryFn, args)` from `~/data/zero-client`. `type` is `'unknown'` until the server answers, then `'complete'`, or `'error'` (whose details carry `error.message` and `retry()`). A plural query's `rows` is `[]` until then and a `.one()` query's row is `undefined`. Show loading while `type` is `'unknown'` with no rows, the empty state once `'complete'` with none, and the error state for `'error'`. An empty list on the branch preview is expected while the branch predates the seed on main. A preview that renders your tab screen is already signed in, so never open a login route or read auth or seed code to explain empty rows; prove the empty state instead.
- An icon comes from `Icons` in `~/interface/icons`. When the glyph a row needs is absent, add it with `icon_add` (the `design-icons` skill) instead of searching icon files.
- Package sources are not in the workspace, except contrast-ui's, read-only at `/node_modules/contrast-ui`. These APIs are the whole surface; never search the filesystem for their types. `data/generated/groupedQueries.ts` lists every query, `on-zero.d.ts` only binds the schema, and dates and money format through `contrast-ui/display`.

## Values and fields

- `import { todayDateOnly, formatDateOnly, formatShortDate, formatRelativeDate, formatCents, centsFromInput } from 'contrast-ui/display'`. `todayDateOnly()` returns a runtime `YYYY-MM-DD` calendar key; `formatDateOnly(key)` displays that key without a timezone shift. `formatShortDate(ms)` and `formatRelativeDate(ms)` take epoch milliseconds. `formatCents(cents: number, currency?: string, locale?: string): string` formats stored integer cents.
- `centsFromInput(text: string): number | null` parses a plain non-negative amount into integer cents, or returns `null` for empty, negative, or over-precise text (disable the submit on `null`); never strip characters with a regex. `CurrencyAmount` from `~/interface/text/CurrencyAmount` renders stored integer cents as `<CurrencyAmount cents={row.amountCents} currency="USD" />`.
- A labeled entry in a form is `Field` from `contrast-ui/forms/Form` (`label`, `value`, `onChangeText`, `placeholder`, `keyboardType`, `testID`) inside `<Form presentation="sheet"><Section plain>...</Section></Form>`. `Input` from `contrast-ui/forms/Input` takes no `label`; it is for entry outside a form, such as search: `<Input size="md" placeholder="..." value={text} onChangeText={setText} keyboardType="default" testID="..." />`. `keyboardType` may be `numeric` or `decimal-pad` for numeric entry.
- `import { DateField } from 'contrast-ui/forms/DateField'`. Use `<DateField label="..." value={dayKey} onChange={setDayKey} testID="..." />`. `value` and the callback are `DateOnlyKey` (`YYYY-MM-DD`) keys; store the key as text, never an instant. A picker always holds a day (iOS has no empty date), so start new state at `useState(todayDateOnly())` and pass a stored key through `dateOnlyKey(stored)` from `contrast-ui/display`; an optional date defaults to today.
- `import { Select } from 'contrast-ui/select/Select'`. Use `<Select label="Category" items={[{ id: 'id', name: 'Label' }]} value={id} onValueChange={setId} />`. `label` is required and shows on every platform; there is no `placeholder`. Each item has `id`, `name`, and optional `icon`; build items from `choiceCatalog` in `data/catalog.ts`. `value` is exactly what the form holds: until the user picks, pass the empty value; the select never shows a choice the form does not hold.
- Every display label for a declared choice set is `choiceCatalog.<set>[id]` from `import { choiceCatalog } from '~/data/catalog'`. That one file holds every set; there are no per-table label or category files to look for.

## Presentation

- A create or edit form uses an `add.tsx` route beside the screen, declared by its `_layout.tsx` with `formSheetOptions({ initialDetent: 'full' })` from `contrast-ui/sheet/routeSheetOptions`. A row action can open that route with a record id; each form mode validates all required visible fields. Navigate with `useRouter` from `one` and `router.push(...)`.
- The template frame is `import { SheetScreen } from '~/interface/dialogs/SheetScreen'`. Render `<SheetScreen title="..." testID="..." action={{ label: 'Save', testID: '...', disabled: pending || !valid, disabledReason: valid ? undefined : 'Complete the required fields', onPress: save }}>...fields...</SheetScreen>`. It owns the close button, scrolling, and primary action. Close after the save succeeds with `router.back()`; leave the form open on failure.
- A form that sets a value per choice (one limit per kind) saves through the contract's `upsert` with the choice id and no row id, because that row's id derives from the owner and the choice. Picking a choice that already holds a value edits that row, so the form prefills from the stored row for the picked choice and never adds a second one.
- For content read or confirmed in place, `import { Dialog } from 'contrast-ui/dialog/Dialog'` and use `<Dialog open={open} onOpenChange={setOpen}><Dialog.Header title="..." /><Dialog.Body>...</Dialog.Body><Dialog.Footer>...</Dialog.Footer></Dialog>`. `Dialog` is not the create or edit form host.

## User-picked images

If a form accepts an image, use `import { uploadFile } from '~/interface/upload/uploadFile'` and persist its returned `url`:

```tsx
// web: a hidden input with type="file" accept="image/*"
const file = event.currentTarget.files?.[0]
if (file) setImageUrl((await uploadFile(file)).url)

// native: import { One } from 'one'
const result = await One.ImagePicker.launchLibrary({ mediaTypes: 'images' })
const asset = result.canceled ? null : result.assets[0]
if (asset) setImageUrl((await uploadFile({
  uri: asset.uri,
  name: asset.fileName ?? 'image.jpg',
  type: asset.mimeType ?? 'application/octet-stream',
})).url)
```

Store the uploaded URL, never the picker URI or a blob preview. Keep save disabled while upload is pending and show upload failure in the form.

Submit the live screen only after its named query shows the saved row on reload.
