import { describe, expect, test } from 'vitest'

import { createAsyncContext, setupAsyncLocalStorage } from './asyncContext'

class TestAsyncLocalStorage<T> {
  private store: T | undefined

  getStore(): T | undefined {
    return this.store
  }

  run<R>(store: T, callback: () => R): R {
    const prevStore = this.store
    this.store = store
    try {
      return callback()
    } finally {
      this.store = prevStore
    }
  }
}

describe('createAsyncContext', () => {
  test('uses configured async local storage when provided', async () => {
    setupAsyncLocalStorage(TestAsyncLocalStorage)

    const context = createAsyncContext<string>()

    await expect(context.run('viewer-1', async () => context.get())).resolves.toBe(
      'viewer-1',
    )

    setupAsyncLocalStorage(null)
  })

  test('initializes server storage before first run', async () => {
    setupAsyncLocalStorage(null)

    const context = createAsyncContext<string>()

    await expect(context.run('viewer-1', async () => context.get())).resolves.toBe(
      'viewer-1',
    )
  })
})
