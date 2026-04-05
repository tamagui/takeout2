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

    // models.ts: imports both model files, handles user → userPublic
    const models = result.files['models.ts']!
    expect(models).toContain("import * as todo from '../models/todo'")
    expect(models).toContain("import * as userPublic from '../models/user'")
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
    // type reference fallback
    expect(synced).toContain('filtered: defineQuery(')
    expect(synced).toMatch(/filtered: defineQuery\(\s*v\.unknown\(\)/)
    // permission export skipped
    expect(synced).not.toContain('permission: defineQuery')

    expect(result.queryCount).toBe(4) // permission excluded
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
