import { describe, expect, test } from 'vitest'

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

    if (sql.includes('INSERT INTO "zero_0"."mutations"')) {
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
