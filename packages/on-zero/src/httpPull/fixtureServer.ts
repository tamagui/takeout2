import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

import type { AddressInfo } from 'node:net'

export type Row = Record<string, string>

type TableName = 'user' | 'project' | 'member'
type Tables = Record<TableName, Map<string, Row>>
type ClientMutationResults = Map<string, Map<string, Map<number, MutationResult>>>

interface PullBody {
  clientID: string
  clientGroupID: string
  cookie: number | null
}

interface PushMutation {
  type: string
  name: string
  clientID: string
  id: number
  args: Row[]
}

interface PushBody {
  clientGroupID: string
  mutations: PushMutation[]
}

type MutationResult = Record<string, never> | { error: 'app'; details: string }

const tableNames: TableName[] = ['user', 'project', 'member']

export async function startZeroHttpServer(opts?: {
  seed?: { user?: Row[]; project?: Row[]; member?: Row[] }
}): Promise<{
  url: string
  version(): number
  rows(table: string): Row[]
  close(): Promise<void>
}> {
  const tables = seedTables(opts?.seed)
  const lmids = new Map<string, Map<string, number>>()
  const mutationResults: ClientMutationResults = new Map()
  const clientGroupUsers = new Map<string, string>()
  let cookie = 1

  const server = createServer(async (req, res) => {
    try {
      if (req.method !== 'POST') {
        sendJSON(res, 404, { error: 'not found' })
        return
      }

      const path = new URL(req.url || '/', 'http://127.0.0.1').pathname
      const userID = authenticate(req, tables)
      if (!userID) {
        sendJSON(res, 401, { error: 'unauthorized' })
        return
      }

      if (path === '/pull') {
        const body = (await readJSON(req)) as PullBody
        if (!bindClientGroup(clientGroupUsers, body.clientGroupID, userID)) {
          sendJSON(res, 403, { error: 'client group belongs to a different user' })
          return
        }
        if (body.cookie === cookie) {
          sendJSON(res, 200, { cookie, unchanged: true })
          return
        }
        if (typeof body.cookie === 'number' && body.cookie > cookie) {
          sendJSON(res, 409, {
            error: `future cookie ${body.cookie} is ahead of server cookie ${cookie}`,
          })
          return
        }

        sendJSON(res, 200, {
          cookie,
          lastMutationIDChanges: lastMutationIDChanges(lmids, body.clientGroupID),
          rowsPatch: [{ op: 'clear' }, ...visibleRowsPatch(tables, userID)],
        })
        return
      }

      if (path === '/push') {
        const body = (await readJSON(req)) as PushBody
        if (!bindClientGroup(clientGroupUsers, body.clientGroupID, userID)) {
          sendJSON(res, 403, { error: 'client group belongs to a different user' })
          return
        }
        const mutations = Array.isArray(body.mutations) ? body.mutations : []
        const gap = findMutationGap(lmids, body.clientGroupID, mutations)
        if (gap) {
          sendJSON(res, 500, { error: gap })
          return
        }

        const pushResults: Array<{
          id: { clientID: string; id: number }
          result: MutationResult
        }> = []
        let processedNewMutation = false

        for (const mutation of mutations) {
          const current = lmidFor(lmids, body.clientGroupID, mutation.clientID)
          if (mutation.id <= current) {
            pushResults.push({
              id: { clientID: mutation.clientID, id: mutation.id },
              result:
                resultForMutation(
                  mutationResults,
                  body.clientGroupID,
                  mutation.clientID,
                  mutation.id,
                ) || {},
            })
            continue
          }

          const result = applyMutation(tables, userID, mutation)
          setLMID(lmids, body.clientGroupID, mutation.clientID, mutation.id)
          setMutationResult(
            mutationResults,
            body.clientGroupID,
            mutation.clientID,
            mutation.id,
            result,
          )
          processedNewMutation = true
          pushResults.push({
            id: { clientID: mutation.clientID, id: mutation.id },
            result,
          })
        }

        if (processedNewMutation) cookie += 1
        sendJSON(res, 200, { pushResponse: { mutations: pushResults } })
        return
      }

      sendJSON(res, 404, { error: 'not found' })
    } catch (err) {
      sendJSON(res, 500, { error: err instanceof Error ? err.message : String(err) })
    }
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)
      resolve()
    })
  })

  const address = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${address.port}`,
    version: () => cookie,
    rows: (table) => rowsForTable(tables, table),
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()))
      }),
  }
}

function seedTables(seed?: { user?: Row[]; project?: Row[]; member?: Row[] }) {
  const tables: Tables = {
    user: new Map(),
    project: new Map(),
    member: new Map(),
  }
  for (const table of tableNames) {
    for (const row of seed?.[table] || []) {
      if (typeof row.id === 'string') tables[table].set(row.id, cloneRow(row))
    }
  }
  return tables
}

function authenticate(req: IncomingMessage, tables: Tables) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer token-')) return null
  const userID = header.slice('Bearer token-'.length)
  return tables.user.has(userID) ? userID : null
}

function bindClientGroup(
  clientGroupUsers: Map<string, string>,
  clientGroupID: string,
  userID: string,
) {
  const owner = clientGroupUsers.get(clientGroupID)
  if (owner) return owner === userID
  clientGroupUsers.set(clientGroupID, userID)
  return true
}

function visibleRowsPatch(tables: Tables, userID: string) {
  const visibleProjectIDs = visibleProjectIDSet(tables, userID)
  const rows: Array<{ op: 'put'; tableName: TableName; value: Row }> = []
  const user = tables.user.get(userID)
  if (user) rows.push({ op: 'put', tableName: 'user', value: cloneRow(user) })

  for (const project of tables.project.values()) {
    if (visibleProjectIDs.has(project.id)) {
      rows.push({ op: 'put', tableName: 'project', value: cloneRow(project) })
    }
  }

  for (const member of tables.member.values()) {
    if (visibleProjectIDs.has(member.projectId)) {
      rows.push({ op: 'put', tableName: 'member', value: cloneRow(member) })
    }
  }
  return rows
}

function visibleProjectIDSet(tables: Tables, userID: string) {
  const projectIDs = new Set<string>()
  for (const project of tables.project.values()) {
    if (project.ownerId === userID) projectIDs.add(project.id)
  }
  for (const member of tables.member.values()) {
    if (member.userId === userID && tables.project.has(member.projectId)) {
      projectIDs.add(member.projectId)
    }
  }
  return projectIDs
}

function findMutationGap(
  lmids: Map<string, Map<string, number>>,
  clientGroupID: string,
  mutations: PushMutation[],
) {
  const nextLMIDs = new Map<string, number>()
  for (const mutation of mutations) {
    const current =
      nextLMIDs.get(mutation.clientID) ?? lmidFor(lmids, clientGroupID, mutation.clientID)
    if (mutation.id <= current) continue
    if (mutation.id !== current + 1) {
      return `mutation id gap for ${mutation.clientID}: got ${mutation.id}, expected ${
        current + 1
      }`
    }
    nextLMIDs.set(mutation.clientID, mutation.id)
  }
  return null
}

function applyMutation(
  tables: Tables,
  userID: string,
  mutation: PushMutation,
): MutationResult {
  if (mutation.type !== 'custom') return appError('unsupported')
  const args = mutation.args[0] || {}

  if (mutation.name === 'project|create') {
    if (tables.project.has(args.id)) return appError('exists')
    if (args.ownerId !== userID) return appError('forbidden')
    tables.project.set(args.id, {
      id: args.id,
      ownerId: args.ownerId,
      name: args.name,
    })
    return {}
  }

  if (mutation.name === 'project|rename') {
    const project = tables.project.get(args.id)
    if (!project) return appError('not-found')
    if (project.ownerId !== userID) return appError('forbidden')
    tables.project.set(args.id, { ...project, name: args.name })
    return {}
  }

  if (mutation.name === 'member|add') {
    const project = tables.project.get(args.projectId)
    if (!project) return appError('not-found')
    if (project.ownerId !== userID) return appError('forbidden')
    if (tables.member.has(args.id)) return appError('exists')
    tables.member.set(args.id, {
      id: args.id,
      projectId: args.projectId,
      userId: args.userId,
    })
    return {}
  }

  if (mutation.name === 'member|remove') {
    const member = tables.member.get(args.id)
    if (!member) return appError('not-found')
    const project = tables.project.get(member.projectId)
    if (!project) return appError('not-found')
    if (project.ownerId !== userID) return appError('forbidden')
    tables.member.delete(args.id)
    return {}
  }

  return appError('unsupported')
}

function appError(details: string): MutationResult {
  return { error: 'app', details }
}

function lastMutationIDChanges(
  lmids: Map<string, Map<string, number>>,
  clientGroupID: string,
) {
  return Object.fromEntries(lmids.get(clientGroupID) || [])
}

function lmidFor(
  lmids: Map<string, Map<string, number>>,
  clientGroupID: string,
  clientID: string,
) {
  return lmids.get(clientGroupID)?.get(clientID) || 0
}

function setLMID(
  lmids: Map<string, Map<string, number>>,
  clientGroupID: string,
  clientID: string,
  id: number,
) {
  let group = lmids.get(clientGroupID)
  if (!group) {
    group = new Map()
    lmids.set(clientGroupID, group)
  }
  group.set(clientID, id)
}

function resultForMutation(
  results: ClientMutationResults,
  clientGroupID: string,
  clientID: string,
  id: number,
) {
  return results.get(clientGroupID)?.get(clientID)?.get(id)
}

function setMutationResult(
  results: ClientMutationResults,
  clientGroupID: string,
  clientID: string,
  id: number,
  result: MutationResult,
) {
  let group = results.get(clientGroupID)
  if (!group) {
    group = new Map()
    results.set(clientGroupID, group)
  }
  let client = group.get(clientID)
  if (!client) {
    client = new Map()
    group.set(clientID, client)
  }
  client.set(id, result)
}

function rowsForTable(tables: Tables, table: string): Row[] {
  if (!isTableName(table)) return []
  return [...tables[table].values()].map(cloneRow)
}

function isTableName(table: string): table is TableName {
  return (tableNames as string[]).includes(table)
}

function cloneRow(row: Row): Row {
  return { ...row }
}

async function readJSON(req: IncomingMessage): Promise<unknown> {
  let body = ''
  for await (const chunk of req) body += chunk
  return body ? JSON.parse(body) : {}
}

function sendJSON(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}
