import { describe, expect, test } from 'vitest'

import { assertZeroInstancePartition } from './multi'

describe('assertZeroInstancePartition', () => {
  const control = { user: 1, workspace: 1 }
  const project = { message: 1, thread: 1 }

  test('passes when every namespace belongs to exactly one partition', () => {
    expect(() =>
      assertZeroInstancePartition(
        'query namespace',
        { user: {}, workspace: {}, message: {}, thread: {} },
        { control, project },
      ),
    ).not.toThrow()
  })

  test('throws on a namespace missing from every partition (the planGrant drift)', () => {
    expect(() =>
      assertZeroInstancePartition(
        'query namespace',
        { user: {}, planGrant: {} },
        { control, project },
      ),
    ).toThrow(/planGrant.*missing from the instance partition/)
  })

  test('throws on a namespace claimed by more than one partition', () => {
    expect(() =>
      assertZeroInstancePartition(
        'query namespace',
        { user: {} },
        { control, project: { user: 1 } },
      ),
    ).toThrow(/user.*more than one instance partition/)
  })
})
