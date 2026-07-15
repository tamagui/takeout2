import { describe, expect, test } from 'vitest'

import { generateLite } from './generate-lite'
import type { LiteParseFn, LiteParsedFile } from './generate-lite'

// minimal hand-rolled "parser" backed by a lookup table. the real caller
// (e.g. a browser worker) will plug in acorn+acorn-typescript here; for the
// test we just return pre-baked lite ast shapes keyed by file path, which
// keeps the test focused on generate-lite's wiring rather than ast walking.
function makeParse(table: Record<string, LiteParsedFile>): LiteParseFn {
  return (_src, path) => {
    const entry = table[path]
    if (!entry) {
      throw new Error(`no lite ast fixture for ${path}`)
    }
    return entry
  }
}

const DIR = '/proj/src/data'

describe('generateLite', () => {
  test('emits models.ts, syncedMutations.ts, and README.md from inline types', () => {
    const files: Record<string, string> = {
      [`${DIR}/models/todo.ts`]: '// fake source, parser returns fixture',
      [`${DIR}/models/user.ts`]: '// fake source, parser returns fixture',
    }

    const fixtures: Record<string, LiteParsedFile> = {
      [`${DIR}/models/todo.ts`]: {
        mutations: [
          {
            modelName: 'todo',
            handlers: [
              {
                name: 'toggle',
                paramTypeText: '{ id: string; isActive: boolean }',
              },
              {
                name: 'rename',
                paramTypeText: '{ id: string; title: string }',
              },
            ],
            schema: null,
          },
        ],
        queries: [],
      },
      [`${DIR}/models/user.ts`]: {
        mutations: [
          {
            modelName: 'user',
            handlers: [
              {
                name: 'finishOnboarding',
                // null = no second param / void
                paramTypeText: null,
              },
            ],
            schema: null,
          },
        ],
        queries: [],
      },
    }

    const result = generateLite({
      files,
      dir: DIR,
      parse: makeParse(fixtures),
    })

    // output file set
    expect(Object.keys(result.files).sort()).toEqual([
      'README.md',
      'models.ts',
      'syncedMutations.ts',
    ])

    // models.ts: aliases the user import without changing the model key
    const models = result.files['models.ts']!
    expect(models).toContain("import * as todo from '../models/todo'")
    expect(models).toContain("import * as userPublic from '../models/user'")
    expect(models).toContain('user: userPublic,')
    expect(models).not.toContain('\n  userPublic,')
    expect(models).toContain('export const models = {')

    // syncedMutations.ts: inline types resolve to v.object validators
    const syncedMutations = result.files['syncedMutations.ts']!
    expect(syncedMutations).toContain('toggle:')
    expect(syncedMutations).toContain('v.object({')
    expect(syncedMutations).toContain('id: v.string()')
    expect(syncedMutations).toContain('isActive: v.boolean()')
    expect(syncedMutations).toContain('rename:')
    expect(syncedMutations).toContain('title: v.string()')
    // null param → v.void_()
    expect(syncedMutations).toContain('finishOnboarding: v.void_()')

    expect(result.modelCount).toBe(2)
    expect(result.schemaCount).toBe(0)
    expect(result.mutationCount).toBe(3)
  })

  test('parses newline-separated mutation object types', () => {
    const files: Record<string, string> = {
      [`${DIR}/models/agentEvent.ts`]: '// fake',
      [`${DIR}/models/deployment.ts`]: '// fake',
    }

    const fixtures: Record<string, LiteParsedFile> = {
      [`${DIR}/models/agentEvent.ts`]: {
        mutations: [
          {
            modelName: 'agentEvent',
            handlers: [
              {
                name: 'claimReviewLease',
                paramTypeText: `{
                  id: string
                  projectId: string
                  createdAt: number
                }`,
              },
            ],
            schema: null,
          },
        ],
        queries: [],
      },
      [`${DIR}/models/deployment.ts`]: {
        mutations: [
          {
            modelName: 'deployment',
            handlers: [
              {
                name: 'deploy',
                paramTypeText: `{
                  id: string
                  platform?: string // 'web' | 'ios'
                  buildTier?: string // 'dev' | 'testflight' | 'production'
                }`,
              },
            ],
            schema: null,
          },
        ],
        queries: [],
      },
    }

    const result = generateLite({
      files,
      dir: DIR,
      parse: makeParse(fixtures),
    })

    const synced = result.files['syncedMutations.ts']!
    expect(synced).toContain('claimReviewLease:')
    expect(synced).toContain('projectId: v.string()')
    expect(synced).toContain('createdAt: v.number()')
    expect(synced).toContain('deploy:')
    expect(synced).toContain('platform: v.optional(v.string())')
    expect(synced).toContain('buildTier: v.optional(v.string())')
    expect(synced).not.toContain('claimReviewLease: v.object({})')
    expect(synced).not.toContain('deploy: v.object({})')
  })

  test('parses object intersections and skips index signatures', () => {
    const files: Record<string, string> = {
      [`${DIR}/models/agent.ts`]: '// fake',
    }

    const fixtures: Record<string, LiteParsedFile> = {
      [`${DIR}/models/agent.ts`]: {
        mutations: [
          {
            modelName: 'agent',
            handlers: [
              {
                name: 'update',
                paramTypeText: `{
                  id: string
                } & {
                  status?: string
                  currentTaskId?: string
                  [key: string]: unknown
                }`,
              },
            ],
            schema: null,
          },
        ],
        queries: [],
      },
    }

    const result = generateLite({
      files,
      dir: DIR,
      parse: makeParse(fixtures),
    })

    const synced = result.files['syncedMutations.ts']!
    expect(synced).toContain('update:')
    expect(synced).toContain('id: v.string()')
    expect(synced).toContain('status: v.optional(v.string())')
    expect(synced).toContain('currentTaskId: v.optional(v.string())')
    expect(synced).not.toContain('[key')
    expect(synced).not.toContain('update: v.object({})')
  })

  test('falls back to v.unknown() for type references', () => {
    const files: Record<string, string> = {
      [`${DIR}/models/post.ts`]: '// fake',
    }

    const fixtures: Record<string, LiteParsedFile> = {
      [`${DIR}/models/post.ts`]: {
        mutations: [
          {
            modelName: 'post',
            handlers: [
              {
                name: 'archive',
                // bare type reference — parseTypeString returns null, so
                // generate-lite should fall back to v.unknown() rather than
                // attempting cross-file type resolution.
                paramTypeText: 'ArchiveParams',
              },
              {
                name: 'publish',
                // primitive, should resolve
                paramTypeText: 'string',
              },
            ],
            schema: null,
          },
        ],
        queries: [],
      },
    }

    const result = generateLite({
      files,
      dir: DIR,
      parse: makeParse(fixtures),
    })

    const synced = result.files['syncedMutations.ts']!
    expect(synced).toContain('archive: v.unknown()')
    expect(synced).toContain('publish: v.string()')
  })

  test('uses v.unknown() for explicitly unknown mutation params', () => {
    const files: Record<string, string> = {
      [`${DIR}/models/project.ts`]: '// fake',
    }

    const fixtures: Record<string, LiteParsedFile> = {
      [`${DIR}/models/project.ts`]: {
        mutations: [
          {
            modelName: 'project',
            handlers: [{ name: 'insert', paramTypeText: 'unknown' }],
            schema: null,
          },
        ],
        queries: [],
      },
    }

    const result = generateLite({
      files,
      dir: DIR,
      parse: makeParse(fixtures),
    })

    expect(result.files['syncedMutations.ts']!).toContain('insert: v.unknown()')
  })

  test('emits query files with v.unknown() fallback for references', () => {
    const files: Record<string, string> = {
      [`${DIR}/models/post.ts`]: '// fake',
      [`${DIR}/queries/post.ts`]: '// fake',
    }

    const fixtures: Record<string, LiteParsedFile> = {
      [`${DIR}/models/post.ts`]: {
        mutations: [],
        queries: [],
      },
      [`${DIR}/queries/post.ts`]: {
        mutations: [],
        queries: [
          // no-arg query → void
          { name: 'allPosts', paramTypeText: null },
          // inline object → real validator
          { name: 'postById', paramTypeText: '{ id: string }' },
          // primitive
          { name: 'byAuthorId', paramTypeText: 'string' },
          // optional nullable inline object
          {
            name: 'paged',
            paramTypeText:
              '{ pageSize: number; cursor?: { id: string; createdAt: number } | null }',
          },
          // type reference → fallback
          { name: 'filtered', paramTypeText: 'PostFilter' },
          // permission should be skipped
          { name: 'permission', paramTypeText: null },
        ],
      },
    }

    const result = generateLite({
      files,
      dir: DIR,
      parse: makeParse(fixtures),
    })

    // expect both query files
    expect(result.files['groupedQueries.ts']).toBeDefined()
    expect(result.files['syncedQueries.ts']).toBeDefined()

    const grouped = result.files['groupedQueries.ts']!
    expect(grouped).toContain("export * as post from '../queries/post'")

    const synced = result.files['syncedQueries.ts']!
    expect(synced).toContain('allPosts: defineQuery(() => Queries.post.allPosts())')
    expect(synced).toContain('postById: defineQuery(')
    expect(synced).toContain('id: v.string()')
    expect(synced).toContain('byAuthorId: defineQuery(')
    // primitive string param shows up as v.string() validator
    expect(synced).toMatch(/byAuthorId: defineQuery\(\s*v\.string\(\)/)
    expect(synced).toContain('paged: defineQuery(')
    expect(synced).toContain('cursor: v.optional(v.nullable(v.object({')
    // type reference fallback
    expect(synced).toContain('filtered: defineQuery(')
    expect(synced).toMatch(/filtered: defineQuery\(\s*v\.unknown\(\)/)
    // permission export skipped
    expect(synced).not.toContain('permission: defineQuery')

    expect(result.queryCount).toBe(5) // permission excluded
  })

  test('emits types.ts and tables.ts when a model declares a schema inline', () => {
    const files: Record<string, string> = {
      [`${DIR}/models/task.ts`]: '// fake',
    }

    const fixtures: Record<string, LiteParsedFile> = {
      [`${DIR}/models/task.ts`]: {
        mutations: [
          {
            modelName: 'task',
            handlers: [],
            schema: {
              tableName: 'task',
              primaryKeys: ['id'],
              columns: [
                { name: 'id', builderText: 'string()' },
                { name: 'title', builderText: 'string()' },
                { name: 'priority', builderText: 'number()' },
                { name: 'done', builderText: 'boolean()' },
                { name: 'note', builderText: 'string().optional()' },
              ],
            },
          },
        ],
        queries: [],
      },
    }

    const result = generateLite({
      files,
      dir: DIR,
      parse: makeParse(fixtures),
    })

    expect(result.schemaCount).toBe(1)
    expect(result.files['types.ts']).toBeDefined()
    expect(result.files['tables.ts']).toBeDefined()

    const types = result.files['types.ts']!
    expect(types).toContain('export type Task = TableInsertRow<typeof schema.task>')

    const tables = result.files['tables.ts']!
    expect(tables).toContain("export { schema as task } from '../models/task'")

    // crud validators emitted in syncedMutations.ts
    const synced = result.files['syncedMutations.ts']!
    expect(synced).toContain('insert:')
    expect(synced).toContain('update:')
    expect(synced).toContain('delete:')
    // crud count is 3
    expect(result.mutationCount).toBe(3)
  })

  test('ignores nested files and non-ts files inside the models directory', () => {
    const files: Record<string, string> = {
      [`${DIR}/models/post.ts`]: '// fake',
      [`${DIR}/models/README.md`]: 'not a model',
      [`${DIR}/models/helpers/util.ts`]: 'nested should be ignored',
      [`${DIR}/models/post.d.ts`]: 'declaration file, ignored',
      [`${DIR}/models/post.test.ts`]: 'test file, ignored',
      [`${DIR}/models/post.spec.ts`]: 'spec file, ignored',
    }

    const fixtures: Record<string, LiteParsedFile> = {
      [`${DIR}/models/post.ts`]: {
        mutations: [{ modelName: 'post', handlers: [], schema: null }],
        queries: [],
      },
    }

    const result = generateLite({
      files,
      dir: DIR,
      parse: makeParse(fixtures),
    })

    expect(result.modelCount).toBe(1)
    const models = result.files['models.ts']!
    expect(models).toContain("import * as post from '../models/post'")
    expect(models).not.toContain('util')
    expect(models).not.toContain('README')
    expect(models).not.toContain('post.test')
    expect(models).not.toContain('post.spec')
  })

  test('infers mutations/ directory when present', () => {
    const files: Record<string, string> = {
      [`${DIR}/mutations/post.ts`]: '// fake',
    }

    const fixtures: Record<string, LiteParsedFile> = {
      [`${DIR}/mutations/post.ts`]: {
        mutations: [
          {
            modelName: 'post',
            handlers: [{ name: 'publish', paramTypeText: '{ id: string }' }],
            schema: null,
          },
        ],
        queries: [],
      },
    }

    const result = generateLite({
      files,
      dir: DIR,
      parse: makeParse(fixtures),
    })

    // should use mutations dir path in re-exports
    const models = result.files['models.ts']!
    expect(models).toContain("from '../mutations/post'")
  })
})
