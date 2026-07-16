import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'

import * as zero from '@rocicorp/zero'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { generate, generateDrizzleSchemaFile } from './generate'

const testDir = join(tmpdir(), 'on-zero-test-' + Date.now())

beforeEach(() => {
  mkdirSync(join(testDir, 'models'), { recursive: true })
  mkdirSync(join(testDir, 'queries'), { recursive: true })
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
})

describe('generate', () => {
  test('generates models.ts, types.ts, tables.ts from model files', async () => {
    writeFileSync(
      join(testDir, 'models/post.ts'),
      `
import { table, string, boolean } from 'on-zero'

export const schema = table('post', {
  id: string(),
  title: string(),
  published: boolean(),
})
`,
    )

    writeFileSync(
      join(testDir, 'models/comment.ts'),
      `
import { table, string } from 'on-zero'

export const schema = table('comment', {
  id: string(),
  postId: string(),
  body: string(),
})
`,
    )

    writeFileSync(
      join(testDir, 'models/post.test.ts'),
      `throw new Error('test files must not be generated as models')`,
    )
    writeFileSync(
      join(testDir, 'queries/comment.spec.ts'),
      `throw new Error('spec files must not be generated as queries')`,
    )

    const result = await generate({ dir: testDir, silent: true })

    expect(result.modelCount).toBe(2)
    expect(result.schemaCount).toBe(2)
    expect(result.filesChanged).toBeGreaterThan(0)

    // check generated files exist
    expect(existsSync(join(testDir, 'generated/models.ts'))).toBe(true)
    expect(existsSync(join(testDir, 'generated/types.ts'))).toBe(true)
    expect(existsSync(join(testDir, 'generated/tables.ts'))).toBe(true)

    // check models.ts content
    const modelsContent = readFileSync(join(testDir, 'generated/models.ts'), 'utf-8')
    expect(modelsContent).toContain("import * as comment from '../models/comment'")
    expect(modelsContent).toContain("import * as post from '../models/post'")
    expect(modelsContent).not.toContain('post.test')
    expect(modelsContent).toContain('export const models = {')

    // check types.ts content
    const typesContent = readFileSync(join(testDir, 'generated/types.ts'), 'utf-8')
    expect(typesContent).toContain(
      'export type Post = TableInsertRow<typeof schema.post>',
    )
    expect(typesContent).toContain(
      'export type Comment = TableInsertRow<typeof schema.comment>',
    )

    // check tables.ts content
    const tablesContent = readFileSync(join(testDir, 'generated/tables.ts'), 'utf-8')
    expect(tablesContent).toContain("export { schema as post } from '../models/post'")
    expect(tablesContent).toContain(
      "export { schema as comment } from '../models/comment'",
    )
  })

  test('generates query validators from query files', async () => {
    // need at least one model
    writeFileSync(
      join(testDir, 'models/post.ts'),
      `export const schema = table('post', { id: string() })`,
    )

    writeFileSync(
      join(testDir, 'queries/post.ts'),
      `
import { zero } from '../zero'

export const allPosts = () => zero.query.post

export const postById = ({ id }: { id: string }) => zero.query.post.where('id', id)

export const postsByAuthor = ({ authorId, limit }: { authorId: string; limit?: number }) =>
  zero.query.post.where('authorId', authorId).limit(limit ?? 10)
`,
    )

    const result = await generate({ dir: testDir, silent: true })

    expect(result.queryCount).toBe(3)

    // check query files exist
    expect(existsSync(join(testDir, 'generated/groupedQueries.ts'))).toBe(true)
    expect(existsSync(join(testDir, 'generated/syncedQueries.ts'))).toBe(true)

    // check groupedQueries.ts
    const groupedContent = readFileSync(
      join(testDir, 'generated/groupedQueries.ts'),
      'utf-8',
    )
    expect(groupedContent).toContain("export * as post from '../queries/post'")

    // check syncedQueries.ts has validators
    const syncedContent = readFileSync(
      join(testDir, 'generated/syncedQueries.ts'),
      'utf-8',
    )
    expect(syncedContent).toContain('allPosts: defineQuery')
    expect(syncedContent).toContain('postById: defineQuery')
    expect(syncedContent).toContain('postsByAuthor: defineQuery')
    expect(syncedContent).toContain('v.object')
  })

  test('skips permission exports in queries', async () => {
    writeFileSync(
      join(testDir, 'models/post.ts'),
      `export const schema = table('post', { id: string() })`,
    )

    writeFileSync(
      join(testDir, 'queries/post.ts'),
      `
export const permission = () => ({ canRead: true })
export const allPosts = () => zero.query.post
`,
    )

    const result = await generate({ dir: testDir, silent: true })

    expect(result.queryCount).toBe(1)

    const syncedContent = readFileSync(
      join(testDir, 'generated/syncedQueries.ts'),
      'utf-8',
    )
    expect(syncedContent).toContain('allPosts')
    expect(syncedContent).not.toContain('permission:')
  })

  test('aliases user import without changing the model key', async () => {
    writeFileSync(
      join(testDir, 'models/user.ts'),
      `export const schema = table('user', { id: string(), name: string() })`,
    )

    await generate({ dir: testDir, silent: true })

    const modelsContent = readFileSync(join(testDir, 'generated/models.ts'), 'utf-8')
    expect(modelsContent).toContain("import * as userPublic from '../models/user'")
    expect(modelsContent).toContain('user: userPublic,')
    expect(modelsContent).not.toContain('\n  userPublic,')

    const typesContent = readFileSync(join(testDir, 'generated/types.ts'), 'utf-8')
    expect(typesContent).toContain('typeof schema.userPublic')
  })

  test('runs after command when files change', async () => {
    writeFileSync(
      join(testDir, 'models/post.ts'),
      `export const schema = table('post', { id: string() })`,
    )

    // use a command that creates a marker file
    const markerFile = join(testDir, 'after-ran')
    const result = await generate({
      dir: testDir,
      silent: true,
      after: `touch ${markerFile}`,
    })

    expect(result.filesChanged).toBeGreaterThan(0)
    expect(existsSync(markerFile)).toBe(true)
  })

  test('does not regenerate when nothing changed', async () => {
    writeFileSync(
      join(testDir, 'models/post.ts'),
      `export const schema = table('post', { id: string() })`,
    )

    const first = await generate({ dir: testDir, silent: true })
    expect(first.filesChanged).toBeGreaterThan(0)

    const second = await generate({ dir: testDir, silent: true })
    expect(second.filesChanged).toBe(0)
  })

  test('force regenerates without source changes', async () => {
    writeFileSync(
      join(testDir, 'models/post.ts'),
      `export const schema = table('post', { id: string() })`,
    )
    writeFileSync(
      join(testDir, 'queries/post.ts'),
      `export const allPosts = () => zero.query.post`,
    )
    await generate({ dir: testDir, silent: true })
    const syncedQueriesPath = join(testDir, 'generated/syncedQueries.ts')
    rmSync(syncedQueriesPath)

    await generate({ dir: testDir, silent: true, force: true })

    expect(existsSync(syncedQueriesPath)).toBe(true)
  })
})

describe('mutations', () => {
  test('generates validators for inline mutation param types', async () => {
    writeFileSync(
      join(testDir, 'models/post.ts'),
      `
import { table, string } from 'on-zero'
import { mutations, serverWhere } from 'on-zero'

export const schema = table('post').columns({
  id: string(),
  title: string(),
}).primaryKey('id')

const perm = serverWhere('post', () => true)

export const mutate = mutations(schema, perm, {
  archive: async ({ tx }, { id, reason }: { id: string; reason: string }) => {
    await tx.mutate.post.update({ id, archived: true })
  },
})
`,
    )

    const result = await generate({ dir: testDir, silent: true })

    expect(result.mutationCount).toBeGreaterThan(0)
    expect(existsSync(join(testDir, 'generated/syncedMutations.ts'))).toBe(true)

    const content = readFileSync(join(testDir, 'generated/syncedMutations.ts'), 'utf-8')
    expect(content).toContain('archive')
    expect(content).toContain('v.object')
    expect(content).toContain('v.string()')
  })

  test('generates CRUD validators from schema columns', async () => {
    writeFileSync(
      join(testDir, 'models/task.ts'),
      `
import { table, string, number, boolean } from 'on-zero'
import { mutations, serverWhere } from 'on-zero'

export const schema = table('task').columns({
  id: string(),
  title: string(),
  priority: number(),
  done: boolean(),
  note: string().optional(),
}).primaryKey('id')

const perm = serverWhere('task', () => true)

export const mutate = mutations(schema, perm)
`,
    )

    const result = await generate({ dir: testDir, silent: true })

    const content = readFileSync(join(testDir, 'generated/syncedMutations.ts'), 'utf-8')

    // insert: all columns present
    expect(content).toContain('insert:')
    expect(content).toMatch(/insert:.*v\.object/)

    // update: id required, rest optional
    expect(content).toContain('update:')

    // delete: only PK
    expect(content).toContain('delete:')
  })

  test('treats models without export const mutate as empty mutations', async () => {
    writeFileSync(
      join(testDir, 'models/readonly.ts'),
      `
import { table, string } from 'on-zero'

export const schema = table('readonly').columns({
  id: string(),
  name: string(),
}).primaryKey('id')
`,
    )

    const result = await generate({ dir: testDir, silent: true })
    expect(result.mutationCount).toBe(0)

    const content = readFileSync(join(testDir, 'generated/syncedMutations.ts'), 'utf-8')
    expect(content).toContain('readonly: {')
  })

  test('extracts custom mutations from bare mutations({})', async () => {
    writeFileSync(
      join(testDir, 'models/admin.ts'),
      `
import { mutations } from 'on-zero'

export const mutate = mutations({
  reset: async ({ tx }, { targetId }: { targetId: string }) => {
    await tx.mutate.admin.delete({ id: targetId })
  },
})
`,
    )

    const result = await generate({ dir: testDir, silent: true })

    const content = readFileSync(join(testDir, 'generated/syncedMutations.ts'), 'utf-8')
    expect(content).toContain('reset')
    expect(content).toContain('v.string()')
  })

  test('generates validators for string-model multiline mutation params', async () => {
    writeFileSync(
      join(testDir, 'models/agentEvent.ts'),
      `
import { mutations, serverWhere } from 'on-zero'

const perm = serverWhere('agentEvent', () => true)

export const mutate = mutations('agentEvent', perm, {
  claimReviewLease: async (
    { tx },
    props: {
      id: string
      projectId: string
      agentId: string
      userId: string
      taskId: string
      reviewKey: string
      runnerId: string
      createdAt: number
    },
  ) => {
    await tx.mutate.agentEvent.insert(props)
  },
})
`,
    )

    await generate({ dir: testDir, silent: true })

    const content = readFileSync(join(testDir, 'generated/syncedMutations.ts'), 'utf-8')
    expect(content).toContain('claimReviewLease')
    expect(content).toContain('projectId: v.string()')
    expect(content).toContain('createdAt: v.number()')
    expect(content).not.toContain('claimReviewLease: v.object({})')
  })

  test('generates validators for object intersections', async () => {
    writeFileSync(
      join(testDir, 'models/agent.ts'),
      `
import { mutations, serverWhere } from 'on-zero'

const perm = serverWhere('agent', () => true)

export const mutate = mutations('agent', perm, {
  update: async (
    { tx },
    props: {
      id: string
    } & {
      status?: string
      currentTaskId?: string
      [key: string]: unknown
    },
  ) => {
    await tx.mutate.agent.update(props)
  },
})
`,
    )

    await generate({ dir: testDir, silent: true })

    const content = readFileSync(join(testDir, 'generated/syncedMutations.ts'), 'utf-8')
    expect(content).toContain('update')
    expect(content).toContain('id: v.string()')
    expect(content).toContain('status: v.optional(v.string())')
    expect(content).toContain('currentTaskId: v.optional(v.string())')
    expect(content).not.toContain('update: v.object({})')
    expect(content).not.toContain('[key')
  })

  test('uses v.unknown for untyped mutation payloads', async () => {
    writeFileSync(
      join(testDir, 'models/project.ts'),
      `
import { mutations, serverWhere } from 'on-zero'

const perm = serverWhere('project', () => true)

export const mutate = mutations('project', perm, {
  insert: async ({ tx }, project) => {
    await tx.mutate.project.insert(project)
  },
})
`,
    )

    await generate({ dir: testDir, silent: true })

    const content = readFileSync(join(testDir, 'generated/syncedMutations.ts'), 'utf-8')
    expect(content).toContain('insert: v.unknown()')
    expect(content).not.toContain('insert: v.void_()')
  })

  test('handles mutations with only context param (void)', async () => {
    writeFileSync(
      join(testDir, 'models/user.ts'),
      `
import { table, string } from 'on-zero'
import { mutations, serverWhere } from 'on-zero'

export const schema = table('user').columns({
  id: string(),
  name: string(),
}).primaryKey('id')

const perm = serverWhere('user', () => true)

export const mutate = mutations(schema, perm, {
  finishOnboarding: async ({ tx }) => {
    // no second param
  },
})
`,
    )

    const result = await generate({ dir: testDir, silent: true })

    const content = readFileSync(join(testDir, 'generated/syncedMutations.ts'), 'utf-8')
    // should not crash, void mutations get no validator
    expect(content).toContain('finishOnboarding')
  })

  test('handles primitive param type', async () => {
    writeFileSync(
      join(testDir, 'models/user.ts'),
      `
import { table, string } from 'on-zero'
import { mutations, serverWhere } from 'on-zero'

export const schema = table('user').columns({
  id: string(),
  name: string(),
}).primaryKey('id')

const perm = serverWhere('user', () => true)

export const mutate = mutations(schema, perm, {
  completeSignup: async ({ tx }, userId: string) => {
    await tx.mutate.user.update({ id: userId })
  },
})
`,
    )

    const result = await generate({ dir: testDir, silent: true })

    const content = readFileSync(join(testDir, 'generated/syncedMutations.ts'), 'utf-8')
    expect(content).toContain('completeSignup')
    expect(content).toContain('v.string()')
  })

  test('handles array param type', async () => {
    writeFileSync(
      join(testDir, 'models/batch.ts'),
      `
import { mutations } from 'on-zero'

export const mutate = mutations({
  bulkDelete: async ({ tx }, ids: Array<{ id: string }>) => {
    for (const { id } of ids) await tx.mutate.batch.delete({ id })
  },
})
`,
    )

    const result = await generate({ dir: testDir, silent: true })

    const content = readFileSync(join(testDir, 'generated/syncedMutations.ts'), 'utf-8')
    expect(content).toContain('bulkDelete')
    expect(content).toContain('v.array')
  })

  test('populates mutationCount and caching works', async () => {
    writeFileSync(
      join(testDir, 'models/item.ts'),
      `
import { table, string } from 'on-zero'
import { mutations, serverWhere } from 'on-zero'

export const schema = table('item').columns({
  id: string(),
  name: string(),
}).primaryKey('id')

const perm = serverWhere('item', () => true)

export const mutate = mutations(schema, perm, {
  rename: async ({ tx }, { id, name }: { id: string; name: string }) => {
    await tx.mutate.item.update({ id, name })
  },
})
`,
    )

    const first = await generate({ dir: testDir, silent: true })
    expect(first.mutationCount).toBeGreaterThan(0)

    const second = await generate({ dir: testDir, silent: true })
    expect(second.filesChanged).toBe(0)
    expect(second.mutationCount).toBe(first.mutationCount)
  })
})

describe('type resolution', () => {
  test('resolves imported type references for mutations', async () => {
    // types file that the model imports from
    writeFileSync(
      join(testDir, 'models/types.ts'),
      `
export type ArchiveParams = {
  id: string
  reason: string
  archived: boolean
}
`,
    )

    writeFileSync(
      join(testDir, 'models/post.ts'),
      `
import { table, string, boolean } from 'on-zero'
import { mutations } from 'on-zero'
import type { ArchiveParams } from './types'

export const mutate = mutations({
  archive: async ({ tx }, params: ArchiveParams) => {
    await tx.mutate.post.update(params)
  },
})
`,
    )

    const result = await generate({ dir: testDir, silent: true })

    const content = readFileSync(join(testDir, 'generated/syncedMutations.ts'), 'utf-8')
    // the imported ArchiveParams type should be resolved to its fields
    expect(content).toContain('v.string()')
    expect(content).toContain('v.boolean()')
    expect(content).toContain('reason')
    expect(content).toContain('archived')
  })

  test('resolves utility types like Pick', async () => {
    writeFileSync(
      join(testDir, 'models/types.ts'),
      `
export type Item = {
  id: string
  name: string
  description: string
  count: number
}
`,
    )

    writeFileSync(
      join(testDir, 'models/item.ts'),
      `
import { table, string, number } from 'on-zero'
import { mutations, serverWhere } from 'on-zero'
import type { Item } from './types'

export const schema = table('item').columns({
  id: string(),
  name: string(),
  description: string(),
  count: number(),
}).primaryKey('id')

const perm = serverWhere('item', () => true)

export const mutate = mutations(schema, perm, {
  rename: async ({ tx }, updates: Pick<Item, 'id' | 'name'>) => {
    await tx.mutate.item.update(updates)
  },
})
`,
    )

    const result = await generate({ dir: testDir, silent: true })

    const content = readFileSync(join(testDir, 'generated/syncedMutations.ts'), 'utf-8')
    // Pick should resolve to only id and name
    expect(content).toContain('id')
    expect(content).toContain('name')
    // description and count should NOT be in the rename validator
    expect(content).not.toMatch(/rename:[\s\S]*description/)
    expect(content).not.toMatch(/rename:[\s\S]*count/)
  })

  test('resolves instantiated Zero row fields through Partial and Omit', async () => {
    symlinkSync(
      join(import.meta.dirname, '../../../node_modules'),
      join(testDir, 'node_modules'),
      'dir',
    )
    writeFileSync(
      join(testDir, 'models/types.ts'),
      `
import type { Row } from '@rocicorp/zero'
import { drizzleZeroConfig } from 'drizzle-zero-sqlite'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

const item = sqliteTable('item', {
  id: text().primaryKey(),
  name: text().notNull(),
  description: text().notNull(),
})
const schema = drizzleZeroConfig({ item })

export type Item = Row<(typeof schema)['tables']['item']>
`,
    )

    writeFileSync(
      join(testDir, 'models/item.ts'),
      `
import { mutations } from 'on-zero'
import type { Item } from './types'

type ItemUpdate = { id: string } & Partial<Omit<Item, 'id'>>

export const mutate = mutations('item', {
  update: async ({ tx }, props: ItemUpdate) => {
    await tx.mutate.item.update(props)
  },
})
`,
    )

    await generate({ dir: testDir, silent: true })

    const content = readFileSync(join(testDir, 'generated/syncedMutations.ts'), 'utf-8')
    expect(content).toContain('name: v.optional(v.string())')
    expect(content).toContain('description: v.optional(v.string())')
    expect(content).not.toContain('name: v.optional(v.unknown())')
    expect(content).not.toContain('description: v.optional(v.unknown())')
  })

  test('skips symbol-keyed properties when resolving imported mutation param types', async () => {
    writeFileSync(
      join(testDir, 'models/types.ts'),
      `
export type WeirdParams = {
  id: string
  [Symbol.iterator]?: () => Iterator<string>
}
`,
    )

    writeFileSync(
      join(testDir, 'models/item.ts'),
      `
import { mutations } from 'on-zero'
import type { WeirdParams } from './types'

export const mutate = mutations({
  run: async ({ tx }, params: WeirdParams) => {
    await tx.mutate.item.delete({ id: params.id })
  },
})
`,
    )

    await generate({ dir: testDir, silent: true })

    const content = readFileSync(join(testDir, 'generated/syncedMutations.ts'), 'utf-8')
    expect(content).toContain('run')
    expect(content).toContain('id: v.string()')
    expect(content).not.toContain('__@iterator')
  })

  test('resolves imported types in query params', async () => {
    writeFileSync(
      join(testDir, 'models/post.ts'),
      `export const schema = table('post', { id: string() })`,
    )

    writeFileSync(
      join(testDir, 'queries/types.ts'),
      `
export type PostFilter = {
  authorId: string
  published: boolean
}
`,
    )

    writeFileSync(
      join(testDir, 'queries/post.ts'),
      `
import type { PostFilter } from './types'

export const filteredPosts = (filter: PostFilter) => zero.query.post
`,
    )

    const result = await generate({ dir: testDir, silent: true })

    const content = readFileSync(join(testDir, 'generated/syncedQueries.ts'), 'utf-8')
    expect(content).toContain('filteredPosts')
    expect(content).toContain('v.object')
    expect(content).toContain('authorId')
    expect(content).toContain('v.boolean()')
  })
})

describe('generateDrizzleSchemaFile', () => {
  test('preserves table server names and executable two-hop relationships', () => {
    const schema = {
      tables: {
        users: {
          name: 'users',
          serverName: 'user_records',
          primaryKey: ['id'],
          columns: {
            id: { type: 'string', optional: false, customType: null },
          },
        },
        groups: {
          name: 'groups',
          primaryKey: ['id'],
          columns: {
            id: { type: 'string', optional: false, customType: null },
          },
        },
        memberships: {
          name: 'memberships',
          primaryKey: ['userId', 'groupId'],
          columns: {
            userId: { type: 'string', optional: false, customType: null },
            groupId: { type: 'string', optional: false, customType: null },
          },
        },
      },
      relationships: {
        users: {
          groups: [
            {
              sourceField: ['id'],
              destField: ['userId'],
              destSchema: 'memberships',
              cardinality: 'many' as const,
            },
            {
              sourceField: ['groupId'],
              destField: ['id'],
              destSchema: 'groups',
              cardinality: 'many' as const,
            },
          ],
        },
      },
    }
    const source = generateDrizzleSchemaFile(schema)
    const executableSource = source
      .replace(
        "import { boolean, createSchema, json, number, relationships, string, table } from '@rocicorp/zero'",
        '',
      )
      .replace('export const schema =', 'globalThis.generatedSchema =')
    const context: Record<string, unknown> = { ...zero }

    runInNewContext(executableSource, context)

    expect(source).toContain('const usersTable = table("users").from("user_records")')
    expect(context.generatedSchema).toMatchObject({
      tables: {
        users: {
          serverName: 'user_records',
        },
      },
      relationships: {
        users: {
          groups: schema.relationships.users.groups,
        },
      },
    })
  })
})
