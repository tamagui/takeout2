import { afterEach, describe, expect, test, vi } from 'vitest'

import { observeMutation, onMutationError, type MutationError } from './useMutation'

// a controllable stand-in for Zero's MutatorResult { client, server }.
function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function fakeResult() {
  const client = deferred<unknown>()
  const server = deferred<unknown>()
  return {
    result: { client: client.promise, server: server.promise },
    client,
    server,
  }
}

const SUCCESS = { type: 'success' as const }
const appError = (message: string) => ({
  type: 'error' as const,
  error: { type: 'app' as const, message },
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('observeMutation', () => {
  test('success on both phases reports nothing', async () => {
    const { result, client, server } = fakeResult()
    const errors: MutationError[] = []
    const dispose = onMutationError((e) => errors.push(e))

    const done = observeMutation(result, (e) => errors.push(e))
    client.resolve(SUCCESS)
    server.resolve(SUCCESS)
    await done

    expect(errors).toEqual([])
    dispose()
  })

  test('a server rejection surfaces a normalized error locally and globally', async () => {
    const { result, client, server } = fakeResult()
    const local: MutationError[] = []
    const global: MutationError[] = []
    const dispose = onMutationError((e) => global.push(e))

    const done = observeMutation(result, (e) => local.push(e))
    // optimistic phase succeeds, authoritative phase is rejected by the server
    client.resolve(SUCCESS)
    server.resolve(appError('Could not create post.'))
    await done

    expect(local).toEqual([
      {
        scope: 'server',
        kind: 'app',
        message: 'Could not create post.',
        details: undefined,
      },
    ])
    expect(global).toEqual(local)
    dispose()
  })

  test('client + server both failing emits to the global catch only once', async () => {
    const { result, client, server } = fakeResult()
    const global: MutationError[] = []
    const dispose = onMutationError((e) => global.push(e))

    // a thrown optimistic mutator rejects both phases
    const done = observeMutation(result)
    client.reject(new Error('boom'))
    server.reject(new Error('boom'))
    await done

    expect(global).toHaveLength(1)
    expect(global[0]).toMatchObject({ scope: 'client', kind: 'zero', message: 'boom' })
    dispose()
  })

  test('never rejects even when both phases reject', async () => {
    const { result, client, server } = fakeResult()
    client.reject(new Error('x'))
    server.reject(new Error('x'))
    await expect(observeMutation(result)).resolves.toBeUndefined()
  })

  test('with no listener registered it falls back to console.error in dev', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result, client, server } = fakeResult()
    const done = observeMutation(result)
    client.resolve(SUCCESS)
    server.resolve(appError('denied'))
    await done
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('onMutationError', () => {
  test('dispose stops delivery', async () => {
    const seen: MutationError[] = []
    const dispose = onMutationError((e) => seen.push(e))
    dispose()

    const { result, client, server } = fakeResult()
    const done = observeMutation(result)
    client.resolve(SUCCESS)
    server.resolve(appError('denied'))
    await done
    expect(seen).toEqual([])
  })
})
