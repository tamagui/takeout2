// content-stable identity for useQuery's inner data + info values.
//
// upstream zero-react's view does `data = deepClone(snap)` inside #onData
// whenever the materialized view notifies, which means each notification
// produces a fresh JS reference even when the row's content hasn't changed.
// consumers that destructure `[row] = useQuery(byId, {id})` and then use
// `row` as a useEffect dep — or that depend on `[rows]` for a list query —
// see a "change" on every notification and re-run effects redundantly.
//
// `useContentStable(value)` keeps a ref to the previous value and returns the
// old reference when shallow-content equality holds, so downstream identity
// comparisons (`useMemo`, `useEffect`, `useCallback`) don't false-fire.
//
// equality semantics:
//   - primitives + same-reference                  → return as-is
//   - arrays: same length + each element strict-eq → reuse previous ref
//   - objects: same keys + each value strict-eq    → reuse previous ref
//   - mismatches                                   → swap the ref forward
//
// the per-element check is strict-eq (not recursive). that's intentional —
// it catches the common case where a query result is the same row(s) on a
// re-emit. for nested-object stability the rows themselves get the same
// treatment one level up (the wrapping useQuery already applies this to
// `data` so an array-of-rows query holds row references stable if each row
// content-matches its previous snapshot row).

import { useRef } from 'react'

function arraysShallowEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false
  }
  return true
}

function objectsShallowEqual(a: object, b: object): boolean {
  if (a === b) return true
  const ak = Object.keys(a as Record<string, unknown>)
  const bk = Object.keys(b as Record<string, unknown>)
  if (ak.length !== bk.length) return false
  for (const k of ak) {
    if (
      !Object.is(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
      )
    )
      return false
  }
  return true
}

export function isContentEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (a === null || b === null || a === undefined || b === undefined) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false
  const aIsArr = Array.isArray(a)
  const bIsArr = Array.isArray(b)
  if (aIsArr !== bIsArr) return false
  if (aIsArr && bIsArr) {
    return arraysShallowEqual(a as readonly unknown[], b as readonly unknown[])
  }
  return objectsShallowEqual(a as object, b as object)
}

// returns `value` on first render, then returns the previous reference for as
// long as content-equality holds. mutating the ref during render is safe here
// because we read its current value AFTER deciding whether to swap — no read-
// then-write race that React would warn about.
export function useContentStable<T>(value: T): T {
  const ref = useRef<T>(value)
  if (!isContentEqual(ref.current, value)) {
    ref.current = value
  }
  return ref.current
}
