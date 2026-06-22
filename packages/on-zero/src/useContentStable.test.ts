import { describe, expect, it } from 'vitest'
import { isContentEqual } from './useContentStable'

describe('isContentEqual', () => {
  it('treats primitives by value', () => {
    expect(isContentEqual(1, 1)).toBe(true)
    expect(isContentEqual('a', 'a')).toBe(true)
    expect(isContentEqual(true, true)).toBe(true)
    expect(isContentEqual(undefined, undefined)).toBe(true)
    expect(isContentEqual(null, null)).toBe(true)
    expect(isContentEqual(1, 2)).toBe(false)
    expect(isContentEqual('a', 'b')).toBe(false)
    expect(isContentEqual(null, undefined)).toBe(false)
  })

  it('treats arrays by length + per-element strict-eq', () => {
    expect(isContentEqual([], [])).toBe(true)
    expect(isContentEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(isContentEqual([1, 2, 3], [1, 2])).toBe(false)
    expect(isContentEqual([1, 2, 3], [1, 2, 4])).toBe(false)
    // distinct objects with same fields → strict-eq fails per element
    expect(isContentEqual([{ id: 1 }], [{ id: 1 }])).toBe(false)
    // same object ref shared → strict-eq holds
    const row = { id: 1 }
    expect(isContentEqual([row], [row])).toBe(true)
  })

  it('treats objects by same keys + per-value strict-eq', () => {
    expect(isContentEqual({}, {})).toBe(true)
    expect(isContentEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
    expect(isContentEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    expect(isContentEqual({ a: 1 }, { a: 2 })).toBe(false)
    // distinct nested objects → strict-eq fails on the nested value
    expect(isContentEqual({ row: { id: 1 } }, { row: { id: 1 } })).toBe(false)
  })

  it('rejects mismatched array vs object', () => {
    expect(isContentEqual([], {})).toBe(false)
    expect(isContentEqual([1], { 0: 1 })).toBe(false)
  })

  it('handles a typical zero singular-query refresh — same row content', () => {
    // simulating zero's deepClone: the row is a fresh object but every field
    // matches the previous snapshot. shallow strict-eq sees fresh nested but
    // top-level keys are primitives → equal.
    const prev = { id: 's1', name: 'warden', level: 1, hp: 60, maxHp: 60 }
    const next = { id: 's1', name: 'warden', level: 1, hp: 60, maxHp: 60 }
    expect(isContentEqual(prev, next)).toBe(true)
  })

  it('detects a real refresh — one field changed', () => {
    const prev = { id: 's1', hp: 60 }
    const next = { id: 's1', hp: 59 }
    expect(isContentEqual(prev, next)).toBe(false)
  })

  it('handles zero info objects ({type: "complete"} vs {type: "unknown"})', () => {
    expect(isContentEqual({ type: 'complete' }, { type: 'complete' })).toBe(true)
    expect(isContentEqual({ type: 'complete' }, { type: 'unknown' })).toBe(false)
  })
})
