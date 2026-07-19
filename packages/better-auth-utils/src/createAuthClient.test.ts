import { beforeEach, describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createAuthClient: vi.fn(),
  request: vi.fn(),
}))

vi.mock('better-auth/client', () => ({
  createAuthClient: mocks.createAuthClient,
}))

vi.mock('@take-out/helpers', () => ({
  createEmitter: (_name: string, initialValue: unknown) => {
    const emitter = {
      value: initialValue,
      emit(value: unknown) {
        emitter.value = value
      },
    }
    return emitter
  },
  createStorageValue: () => ({
    get: () => undefined,
    set: vi.fn(),
    remove: vi.fn(),
  }),
  isEqualDeepLite: Object.is,
  useEmitterValue: (emitter: { value: unknown }) => emitter.value,
}))

import { createBetterAuthClient } from './createAuthClient'

describe('createBetterAuthClient signOut', () => {
  beforeEach(() => {
    mocks.request.mockReset()
    mocks.createAuthClient.mockReset()
    mocks.createAuthClient.mockReturnValue({
      $fetch: mocks.request,
      useSession: {
        subscribe: vi.fn(() => vi.fn()),
      },
    })
  })

  test('sends JSON and clears local auth only after server revocation succeeds', async () => {
    const deferred = Promise.withResolvers<{
      data: { success: true }
      error: null
    }>()
    mocks.request.mockReturnValue(deferred.promise)
    const onAuthStateChange = vi.fn()
    const client = createBetterAuthClient({
      baseURL: 'https://auth.example.com',
      onAuthStateChange,
    })

    const pending = client.authClient.signOut()
    expect(mocks.request).toHaveBeenCalledWith('/sign-out', {
      method: 'POST',
      body: {},
    })
    expect(onAuthStateChange).not.toHaveBeenCalled()

    deferred.resolve({ data: { success: true }, error: null })
    await expect(pending).resolves.toEqual({ data: { success: true }, error: null })
    expect(onAuthStateChange).toHaveBeenCalledWith({
      state: 'logged-out',
      session: null,
      user: null,
      token: null,
    })
  })

  test('keeps local auth when server revocation fails', async () => {
    const error = { message: 'network unavailable' }
    mocks.request.mockResolvedValue({ data: null, error })
    const onAuthStateChange = vi.fn()
    const client = createBetterAuthClient({
      baseURL: 'https://auth.example.com',
      onAuthStateChange,
    })

    await expect(client.authClient.signOut()).rejects.toBe(error)
    expect(onAuthStateChange).not.toHaveBeenCalled()
  })
})
