import { describe, expect, test, vi } from 'vitest'

import { createZeroServer } from './createZeroServer'
import { zeroHttpFixtureSchema } from './httpPull/fixtureSchema'

class FakePgClient {
  lastMutationID = 0
  pendingLastMutationID: number | undefined
  mutationResultInserts: unknown[][] = []

  async query(sql: string, params: unknown[] = []) {
    if (sql === 'BEGIN') {
      this.pendingLastMutationID = undefined
      return { rows: [] }
    }

    if (sql === 'COMMIT') {
      if (this.pendingLastMutationID !== undefined) {
        this.lastMutationID = this.pendingLastMutationID
      }
      this.pendingLastMutationID = undefined
      return { rows: [] }
    }

    if (sql === 'ROLLBACK') {
      this.pendingLastMutationID = undefined
      return { rows: [] }
    }

    if (sql.includes('.clients') && sql.includes('RETURNING "lastMutationID"')) {
      const nextMutationID = this.lastMutationID + 1
      this.pendingLastMutationID = nextMutationID
      return { rows: [{ lastMutationID: nextMutationID }] }
    }

    if (sql.includes('information_schema.columns')) {
      return {
        rows: [
          ...schemaRows('user', ['id', 'name']),
          ...schemaRows('project', ['id', 'ownerId', 'name']),
          ...schemaRows('member', ['id', 'projectId', 'userId']),
        ],
      }
    }

    if (
      sql.includes('INSERT INTO "zero_0"."mutations"') ||
      sql.includes('INSERT INTO "zero_0".mutations')
    ) {
      this.mutationResultInserts.push(params)
      return { rows: [] }
    }

    throw new Error(`unexpected fake pg query: ${sql}`)
  }
}

function schemaRows(table: string, columns: string[]) {
  return columns.map((column) => ({
    schema: 'public',
    table,
    column,
    dataType: 'text',
    length: null,
    precision: null,
    scale: null,
    typtype: 'b',
    typename: 'text',
    elemTyptype: null,
    elemTypname: null,
  }))
}

function pushRequest(mutationIDs: number | number[]) {
  const ids = Array.isArray(mutationIDs) ? mutationIDs : [mutationIDs]
  return new Request('http://localhost/push?schema=zero_0&appID=zero', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      clientGroupID: 'cg1',
      mutations: ids.map((mutationID) => ({
        type: 'custom',
        id: mutationID,
        clientID: 'client-a',
        name: 'project.touch',
        args: [{}],
        timestamp: 1,
      })),
      pushVersion: 1,
      timestamp: 1,
      requestID: `req-${ids.join('-')}`,
    }),
  })
}

describe('createZeroServer mutation recovery', () => {
  test('discards async tasks from a rolled-back PostgreSQL mutation', async () => {
    const pg = new FakePgClient()
    let effectRuns = 0
    const zeroServer = createZeroServer({
      schema: zeroHttpFixtureSchema,
      models: {
        project: {
          mutate: {
            touch: async ({ server }) => {
              server?.enqueueTask(async () => {
                effectRuns++
              })
              throw new Error('rejected')
            },
          },
        },
      },
      createServerActions: () => ({}),
      pool: pg as any,
    })

    const result = await zeroServer.handleMutationRequest({
      authData: null,
      request: pushRequest(1),
      skipAsyncTasks: true,
    })

    expect((result.response as any).mutations[0].result).toMatchObject({
      error: 'app',
      message: 'rejected',
    })
    expect(result.asyncTasks).toEqual([])
    expect(effectRuns).toBe(0)
  })

  test('awaits barrier tasks before resolving the push response', async () => {
    const pg = new FakePgClient()
    let releaseBarrier!: () => void
    let markBarrierStarted!: () => void
    const barrierStarted = new Promise<void>((resolve) => {
      markBarrierStarted = resolve
    })
    const barrier = new Promise<void>((resolve) => {
      releaseBarrier = resolve
    })
    const zeroServer = createZeroServer({
      schema: zeroHttpFixtureSchema,
      models: {
        project: {
          mutate: {
            touch: async ({ server }) => {
              server?.enqueueTask(
                async () => {
                  markBarrierStarted()
                  await barrier
                },
                { barrier: true },
              )
            },
          },
        },
      },
      createServerActions: () => ({}),
      pool: pg as any,
    })

    let responseResolved = false
    const resultPromise = zeroServer
      .handleMutationRequest({
        authData: null,
        request: pushRequest(1),
      })
      .then((result) => {
        responseResolved = true
        return result
      })

    await barrierStarted
    await Promise.resolve()
    expect(responseResolved).toBe(false)

    releaseBarrier()
    const result = await resultPromise
    expect((result.response as any).mutations[0].result).toEqual({})
  })

  test('does not fail the push when a background task rejects', async () => {
    const pg = new FakePgClient()
    const error = new Error('background failed')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const zeroServer = createZeroServer({
      schema: zeroHttpFixtureSchema,
      models: {
        project: {
          mutate: {
            touch: async ({ server }) => {
              server?.enqueueTask(async () => {
                throw error
              })
            },
          },
        },
      },
      createServerActions: () => ({}),
      pool: pg as any,
    })

    const result = await zeroServer.handleMutationRequest({
      authData: null,
      request: pushRequest(1),
    })

    expect((result.response as any).mutations[0].result).toEqual({})
    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('[on-zero] async task failed', error)
    })
    consoleError.mockRestore()
  })

  test('registers a promise that settles every background task with the request scheduler', async () => {
    const pg = new FakePgClient()
    const error = new Error('background failed')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    let releaseSibling!: () => void
    const siblingGate = new Promise<void>((resolve) => {
      releaseSibling = resolve
    })
    let siblingFinished = false
    let scheduled: Promise<void> | undefined
    const zeroServer = createZeroServer({
      schema: zeroHttpFixtureSchema,
      models: {
        project: {
          mutate: {
            touch: async ({ server }) => {
              server?.enqueueTask(async () => {
                throw error
              })
              server?.enqueueTask(async () => {
                await siblingGate
                siblingFinished = true
              })
            },
          },
        },
      },
      createServerActions: () => ({}),
      pool: pg as any,
    })

    const result = await zeroServer.handleMutationRequest({
      authData: null,
      request: pushRequest(1),
      scheduleBackgroundTask: (promise) => {
        scheduled = promise
      },
    })

    expect((result.response as any).mutations[0].result).toEqual({})
    expect(scheduled).toBeInstanceOf(Promise)
    expect(siblingFinished).toBe(false)

    let scheduledSettled = false
    void scheduled!.then(() => {
      scheduledSettled = true
    })
    await Promise.resolve()
    expect(scheduledSettled).toBe(false)

    releaseSibling()
    await scheduled

    expect(siblingFinished).toBe(true)
    expect(consoleError).toHaveBeenCalledWith('[on-zero] async task failed', error)
    consoleError.mockRestore()
  })

  test('awaits background tasks when the request has no scheduler', async () => {
    const pg = new FakePgClient()
    let markTaskStarted!: () => void
    const taskStarted = new Promise<void>((resolve) => {
      markTaskStarted = resolve
    })
    let releaseTask!: () => void
    const taskGate = new Promise<void>((resolve) => {
      releaseTask = resolve
    })
    const zeroServer = createZeroServer({
      schema: zeroHttpFixtureSchema,
      models: {
        project: {
          mutate: {
            touch: async ({ server }) => {
              server?.enqueueTask(async () => {
                markTaskStarted()
                await taskGate
              })
            },
          },
        },
      },
      createServerActions: () => ({}),
      pool: pg as any,
    })

    let responseResolved = false
    const resultPromise = zeroServer
      .handleMutationRequest({
        authData: null,
        request: pushRequest(1),
      })
      .then((result) => {
        responseResolved = true
        return result
      })

    await taskStarted
    await Promise.resolve()
    expect(responseResolved).toBe(false)

    releaseTask()
    const result = await resultPromise
    expect((result.response as any).mutations[0].result).toEqual({})
  })

  test('persists alreadyProcessed duplicate results for zero-cache recovery rows', async () => {
    const pg = new FakePgClient()
    const zeroServer = createZeroServer({
      schema: zeroHttpFixtureSchema,
      models: {
        project: {
          mutate: {
            touch: async () => {},
          },
        },
      },
      createServerActions: () => ({}),
      pool: pg as any,
    })

    const first = await zeroServer.handleMutationRequest({
      authData: null,
      request: pushRequest(1),
    })

    expect((first.response as any).mutations[0].result).toEqual({})
    expect(pg.lastMutationID).toBe(1)
    expect(pg.mutationResultInserts).toEqual([])

    const duplicate = await zeroServer.handleMutationRequest({
      authData: null,
      request: pushRequest(1),
    })

    const duplicateResult = (duplicate.response as any).mutations[0].result
    expect(duplicateResult.error).toBe('alreadyProcessed')
    expect(pg.lastMutationID).toBe(1)
    expect(pg.mutationResultInserts).toEqual([
      [
        'cg1',
        'client-a',
        1,
        JSON.stringify({
          error: 'alreadyProcessed',
          details: duplicateResult.details,
        }),
      ],
    ])
  })

  test('persists only alreadyProcessed results in a mixed recovery push', async () => {
    const pg = new FakePgClient()
    const zeroServer = createZeroServer({
      schema: zeroHttpFixtureSchema,
      models: {
        project: {
          mutate: {
            touch: async () => {},
          },
        },
      },
      createServerActions: () => ({}),
      pool: pg as any,
    })

    await zeroServer.handleMutationRequest({
      authData: null,
      request: pushRequest(1),
    })

    const mixed = await zeroServer.handleMutationRequest({
      authData: null,
      request: pushRequest([1, 2]),
    })

    const results = (mixed.response as any).mutations.map((mutation: any) => ({
      id: mutation.id.id,
      result: mutation.result,
    }))
    expect(results[0].result.error).toBe('alreadyProcessed')
    expect(results[1]).toEqual({ id: 2, result: {} })
    expect(pg.lastMutationID).toBe(2)
    expect(pg.mutationResultInserts).toEqual([
      [
        'cg1',
        'client-a',
        1,
        JSON.stringify({
          error: 'alreadyProcessed',
          details: results[0].result.details,
        }),
      ],
    ])
  })
})
