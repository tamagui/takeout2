# Zero immutability and identity stability investigation

## Scope note

There are two different Zero states on disk:

- `takeout` currently installs `@rocicorp/zero@1.6.1`: `/Users/n8/takeout/node_modules/@rocicorp/zero/package.json:3`.
- The requested upstream checkout at `/Users/n8/github/mono` is newer than that installed package. In that checkout, `zero-react` has already removed the `deepClone` from `useQuery`.

That distinction matters. The clone is still real for the package `takeout` consumes today, but current upstream source has already moved the view layer to structural sharing.

## Short answer

For `@rocicorp/zero@1.6.1`, the React `deepClone` is there for a real reason: the underlying `ArrayView` mutates its root array/object graph in place after it has emitted it. Removing the clone against that version would violate React's `useSyncExternalStore` snapshot contract and would expose mutable Zero internals to app code.

For current `/Users/n8/github/mono`, the root cause has already been fixed upstream. `applyChange` now returns immutable copy-on-write data, `ArrayView` reassigns `#root`, and `zero-react` no longer clones. Unchanged rows are intended to preserve object identity.

The practical recommendation for `on-zero` is: improve on-zero-side for now, but do not simply remove the direct-wrapper clone while `on-zero` supports `@rocicorp/zero >=1.5.0` and this repo is on `1.6.1`. The smallest safe improvement is a stable-on-equal layer after cloning, so repeated equal emissions do not replace the public snapshot. Once `takeout` and `on-zero` can require a Zero release containing the upstream structural-sharing code, remove the clone in `createUseQueryDirect.tsx` and rely on Zero's immutable view data.

## The clone sites

`on-zero` direct wrapper still clones every emission:

- `/Users/n8/takeout/packages/on-zero/src/createUseQueryDirect.tsx:147`

Excerpt:

```ts
private onData = (data: unknown, resultType: string, error?: DirectQueryError) => {
  const cloned = data === undefined ? undefined : deepClone(data as ReadonlyJSONValue)
  this.snapshot = getSnapshot(...)
```

The normal `on-zero` wrapper calls upstream `zeroUseQuery` and mostly passes through its result:

- `/Users/n8/takeout/packages/on-zero/src/createUseQuery.tsx:154`

Excerpt:

```ts
const rawOut = zeroUseQuery(queryRequest, effectiveOptions)
```

`takeout`'s installed `@rocicorp/zero@1.6.1` still clones in compiled `zero-react`:

- `/Users/n8/takeout/node_modules/@rocicorp/zero/out/zero-react/src/use-query.js:226`

Excerpt:

```js
#onData = (snap, resultType, error) => {
  const data = snap === void 0 ? snap : deepClone(snap);
  this.#snapshot = getSnapshot(...);
```

But the requested upstream checkout does not:

- `/Users/n8/github/mono/packages/zero-react/src/use-query.tsx:536`

Excerpt:

```ts
#onData = (snap, resultType, error) => {
  // applyChange now returns immutable data structures, so no deep clone needed.
  // Unchanged rows preserve their object identity for React.memo optimization.
  const data = snap as HumanReadable<TReturn>;
```

## Why the clone exists

In the installed `@rocicorp/zero@1.6.1`, the clone protects React from a mutable materialized view.

The materialization path is:

- `Zero.materialize()` delegates to `ZeroContext.materialize()`: `/Users/n8/github/mono/packages/zero-client/src/client/zero.ts:1064`
- `ZeroContext` extends `QueryDelegateBase`: `/Users/n8/github/mono/packages/zero-client/src/client/context.ts:30`
- `materializeImpl()` builds the pipeline and creates an `ArrayView`: `/Users/n8/github/mono/packages/zql/src/query/query-delegate-base.ts:393`
- `arrayViewFactory()` registers `ArrayView.flush()` on transaction commit: `/Users/n8/github/mono/packages/zql/src/query/query-delegate-base.ts:429`

In the installed package, `ArrayView` emits its live root data:

- `/Users/n8/takeout/node_modules/@rocicorp/zero/out/zql/src/ivm/array-view.js:74`
- `/Users/n8/takeout/node_modules/@rocicorp/zero/out/zql/src/ivm/array-view.js:88`

Excerpt:

```js
get data() {
  return this.#root[""];
}
#fireListener(listener) {
  listener(this.data, this.#resultType, this.#error);
}
```

And it mutates that same root on later pushes:

- `/Users/n8/takeout/node_modules/@rocicorp/zero/out/zql/src/ivm/array-view.js:102`

Excerpt:

```js
push(change) {
  this.#dirty = true;
  applyChange(this.#root, changeToViewChange(change), ...);
}
```

The installed `applyChange` mutates in place:

- `Object.assign(existing, ...)`: `/Users/n8/takeout/node_modules/@rocicorp/zero/out/zql/src/ivm/view-apply-change.js:120`
- `view.splice(...)`: `/Users/n8/takeout/node_modules/@rocicorp/zero/out/zql/src/ivm/view-apply-change.js:97`
- `view[bsResult][refCountSymbol]++`: `/Users/n8/takeout/node_modules/@rocicorp/zero/out/zql/src/ivm/view-apply-change.js:127`

So for the released package, this is not just historical defensiveness. It is guarding against a mutable IVM buffer. The `zero-react` source also cites the React external-store rule directly:

- `/Users/n8/takeout/node_modules/@rocicorp/zero/out/zero-react/src/use-query.js:197`

Excerpt:

```js
// The store snapshot returned by getSnapshot must be immutable...
```

The clone has a second observable effect: `deepClone` copies only string keys and skips `undefined` object values:

- `/Users/n8/github/mono/packages/shared/src/deep-clone.ts:35`
- `/Users/n8/github/mono/packages/shared/src/deep-clone.ts:38`

That means it strips Zero's internal symbol metadata (`refCountSymbol`, `idSymbol`) from row objects. That may be incidental, but removing the clone can make those symbols observable via `Object.getOwnPropertySymbols()` or object spread.

## Does Zero mutate emitted data in place?

For `@rocicorp/zero@1.6.1`: yes.

The old view emits `this.data`, which is `#root[""]`, then later `push()` mutates `#root` in place through `applyChange`. That means an already-emitted `rows` reference can be mutated before the next listener callback.

For the current upstream checkout: I did not find post-emission mutation on the materialized view path.

Current upstream changed `ArrayView` to reassign `#root` from `applyChange`:

- `/Users/n8/github/mono/packages/zql/src/ivm/array-view.ts:159`

Excerpt:

```ts
push(change: Change) {
  this.#dirty = true;
  this.#root = applyChange(..., this.#txnDirty);
}
```

After `flush()` emits to listeners, it replaces the transaction dirty set:

- `/Users/n8/github/mono/packages/zql/src/ivm/array-view.ts:173`

Excerpt:

```ts
this.#fireListeners();
this.#txnDirty = new WeakSet();
```

The `WeakSet` mode is transaction-scoped copy-on-write:

- `/Users/n8/github/mono/packages/zql/src/ivm/view-apply-change.ts:124`

Excerpt:

```ts
// The first touch of a node still copies-on-write...
// subsequent touches in the same transaction are in-place.
```

The remaining mutating operations in current upstream are gated by `mutate || owns(...)`, where `owns(...)` means "created/cloned during the current unflushed transaction":

- `Object.assign` only when mutable/owned: `/Users/n8/github/mono/packages/zql/src/ivm/view-apply-change.ts:588`
- `splice` only when mutable/owned: `/Users/n8/github/mono/packages/zql/src/ivm/view-apply-change.ts:724`
- array slot assignment only when mutable/owned: `/Users/n8/github/mono/packages/zql/src/ivm/view-apply-change.ts:887`

The initial hydration path also mutates, but only before the snapshot is observed:

- `/Users/n8/github/mono/packages/zql/src/ivm/array-view.ts:140`

Excerpt:

```ts
// #root is freshly created and not yet observed by any consumer...
```

## What upstream does now for identity

Current upstream implements structural sharing. It path-copies changed ancestors and preserves unchanged rows/subtrees:

- `/Users/n8/github/mono/packages/zql/src/ivm/view-apply-change.ts:165`

Excerpt:

```ts
// Returns new Entry on change, same Entry if unchanged.
// Unchanged entries keep identity...
```

Tests pin this behavior:

- unchanged row survives add: `/Users/n8/github/mono/packages/zql/src/ivm/view-apply-change.test.ts:1723`
- unchanged row survives remove: `/Users/n8/github/mono/packages/zql/src/ivm/view-apply-change.test.ts:1743`
- unchanged row survives editing another row: `/Users/n8/github/mono/packages/zql/src/ivm/view-apply-change.test.ts:1767`
- edited row gets a new reference: `/Users/n8/github/mono/packages/zql/src/ivm/view-apply-change.test.ts:1799`
- unchanged nested children keep references: `/Users/n8/github/mono/packages/zql/src/ivm/view-apply-change.test.ts:1925`
- sibling parent subtree remains stable: `/Users/n8/github/mono/packages/zql/src/ivm/view-apply-change.test.ts:2062`

One important nuance: outer containers still change on real content changes. The tests explicitly expect the root and top-level list to get new references when a modification occurs:

- `/Users/n8/github/mono/packages/zql/src/ivm/view-apply-change.test.ts:1822`

So upstream's current model is not "the rows array is stable forever"; it is "unchanged row/subtree objects are stable, changed ancestor arrays are replaced."

In `zero-react`, repeated empty snapshots are canonicalized:

- `/Users/n8/github/mono/packages/zero-react/src/use-query.tsx:268`
- `/Users/n8/github/mono/packages/zero-react/src/use-query.test.tsx:400`
- `/Users/n8/github/mono/packages/zero-react/src/use-query.test.tsx:413`

For arbitrary duplicate non-empty listener callbacks, `zero-react` still builds a new `[data, details]` tuple. The real view should not normally emit duplicate dirty snapshots; it emits on `flush()` when dirty or when result status changes.

## Replacement options

### Structural sharing

This is the right upstream fix, and current `/Users/n8/github/mono` already implements it. It removes the need for `deepClone` while preserving unchanged row/subtree identity.

This is better than an equality wrapper because it avoids both O(n) clone cost and O(n) equality cost on every emission, and it gives downstream components meaningful row identity.

### Freezing plus skipping clone

Not viable against `@rocicorp/zero@1.6.1`. The old view mutates the emitted arrays/objects later with `splice`, `Object.assign`, and refcount writes. Freezing those objects would either throw in Zero internals or force a second mutable copy path.

Potentially viable as a dev-only assertion in current upstream, but it is extra runtime work and not needed for production identity.

### Stable-on-equal wrapper

Viable as a less invasive on-zero mitigation, but only if it does not remove the clone for old Zero versions.

For `createUseQueryDirect.tsx`, the safe pattern is:

```ts
const cloned = data === undefined ? undefined : deepClone(data as ReadonlyJSONValue)
const next = getSnapshot(this.singular, cloned, resultType as DirectResultType, this.retry, error)
if (sameSnapshotContent(this.snapshot, next)) return
this.snapshot = next
for (const listener of this.listeners) listener()
```

`sameSnapshotContent` should compare:

- data JSON content,
- result `type`,
- error payload if `type === 'error'`.

This keeps the public snapshot reference stable across duplicate equal emissions and can skip notifying React in that case. It still pays the clone cost, but with old Zero that cost is the price of isolating consumers from a mutable internal view.

For `createUseQuery.tsx`, the normal `zeroUseQuery` path can similarly stabilize the returned tuple after `rawOut`, using the existing `lastRef` concept. That would not prevent the component containing `useQuery` from re-rendering after upstream notifies, but it would preserve identity for props/dependency arrays passed below that component.

## What would break if the clone were removed?

Against current `/Users/n8/github/mono`: nothing obvious. The clone is already removed from `zero-react`, and the view tests now pin immutable structural sharing instead.

Against installed `@rocicorp/zero@1.6.1`: removing the clone would break the snapshot contract. Previously returned `rows` objects could be mutated by later IVM updates. User mutation of returned rows could also corrupt Zero's internal view, because the object would no longer be a defensive copy.

I did not find a test that directly asserts "React snapshots are cloned." The React tests around `ViewStore` pin canonical empty snapshot identity:

- `/Users/n8/github/mono/packages/zero-react/src/use-query.test.tsx:400`
- `/Users/n8/github/mono/packages/zero-react/src/use-query.test.tsx:438`

The same tests have TODOs to assert passthrough row identity:

- `/Users/n8/github/mono/packages/zero-react/src/use-query.test.tsx:404`
- `/Users/n8/github/mono/packages/zero-react/src/use-query.test.tsx:441`

The current view tests pin the opposite of cloned-snapshot semantics: unchanged rows/subtrees should keep object identity.

## Recommendation

Improve on-zero-side now, then remove the clone after upgrading the Zero floor.

Specifically:

1. Keep `deepClone` in `createUseQueryDirect.tsx` while `on-zero` supports `@rocicorp/zero >=1.5.0` and `takeout` is installed on `1.6.1`.
2. Add a stable-on-equal check after cloning in `createUseQueryDirect.tsx` so duplicate equal emissions keep the previous snapshot and do not notify React.
3. Optionally add the same returned-tuple stabilization around `zeroUseQuery` in `createUseQuery.tsx` for downstream prop/dependency identity.
4. Push or wait for the upstream structural-sharing fix to ship in an `@rocicorp/zero` release, then raise `on-zero`'s peer/version floor and remove the direct-wrapper clone entirely.

The upstream fix is the real fix. The on-zero stable-on-equal layer is a pragmatic compatibility bridge for current released Zero versions.
