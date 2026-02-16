import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { generate } from './generate'

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
`
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
`
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
    expect(modelsContent).toContain('export const models = {')

    // check types.ts content
    const typesContent = readFileSync(join(testDir, 'generated/types.ts'), 'utf-8')
    expect(typesContent).toContain(
      'export type Post = TableInsertRow<typeof schema.post>'
    )
    expect(typesContent).toContain(
      'export type Comment = TableInsertRow<typeof schema.comment>'
    )

    // check tables.ts content
    const tablesContent = readFileSync(join(testDir, 'generated/tables.ts'), 'utf-8')
    expect(tablesContent).toContain("export { schema as post } from '../models/post'")
    expect(tablesContent).toContain(
      "export { schema as comment } from '../models/comment'"
    )
  })

  test('generates query validators from query files', async () => {
    // need at least one model
    writeFileSync(
      join(testDir, 'models/post.ts'),
      `export const schema = table('post', { id: string() })`
    )

    writeFileSync(
      join(testDir, 'queries/post.ts'),
      `
import { zero } from '../zero'

export const allPosts = () => zero.query.post

export const postById = ({ id }: { id: string }) => zero.query.post.where('id', id)

export const postsByAuthor = ({ authorId, limit }: { authorId: string; limit?: number }) =>
  zero.query.post.where('authorId', authorId).limit(limit ?? 10)
`
    )

    const result = await generate({ dir: testDir, silent: true })

    expect(result.queryCount).toBe(3)

    // check query files exist
    expect(existsSync(join(testDir, 'generated/groupedQueries.ts'))).toBe(true)
    expect(existsSync(join(testDir, 'generated/syncedQueries.ts'))).toBe(true)

    // check groupedQueries.ts
    const groupedContent = readFileSync(
      join(testDir, 'generated/groupedQueries.ts'),
      'utf-8'
    )
    expect(groupedContent).toContain("export * as post from '../queries/post'")

    // check syncedQueries.ts has validators
    const syncedContent = readFileSync(
      join(testDir, 'generated/syncedQueries.ts'),
      'utf-8'
    )
    expect(syncedContent).toContain('allPosts: defineQuery')
    expect(syncedContent).toContain('postById: defineQuery')
    expect(syncedContent).toContain('postsByAuthor: defineQuery')
    expect(syncedContent).toContain('v.object')
  })

  test('skips permission exports in queries', async () => {
    writeFileSync(
      join(testDir, 'models/post.ts'),
      `export const schema = table('post', { id: string() })`
    )

    writeFileSync(
      join(testDir, 'queries/post.ts'),
      `
export const permission = () => ({ canRead: true })
export const allPosts = () => zero.query.post
`
    )

    const result = await generate({ dir: testDir, silent: true })

    expect(result.queryCount).toBe(1)

    const syncedContent = readFileSync(
      join(testDir, 'generated/syncedQueries.ts'),
      'utf-8'
    )
    expect(syncedContent).toContain('allPosts')
    expect(syncedContent).not.toContain('permission:')
  })

  test('handles user model special case (userPublic)', async () => {
    writeFileSync(
      join(testDir, 'models/user.ts'),
      `export const schema = table('user', { id: string(), name: string() })`
    )

    await generate({ dir: testDir, silent: true })

    const modelsContent = readFileSync(join(testDir, 'generated/models.ts'), 'utf-8')
    expect(modelsContent).toContain("import * as userPublic from '../models/user'")
    expect(modelsContent).toContain('userPublic,')

    const typesContent = readFileSync(join(testDir, 'generated/types.ts'), 'utf-8')
    expect(typesContent).toContain('typeof schema.userPublic')
  })

  test('runs after command when files change', async () => {
    writeFileSync(
      join(testDir, 'models/post.ts'),
      `export const schema = table('post', { id: string() })`
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
      `export const schema = table('post', { id: string() })`
    )

    const first = await generate({ dir: testDir, silent: true })
    expect(first.filesChanged).toBeGreaterThan(0)

    const second = await generate({ dir: testDir, silent: true })
    expect(second.filesChanged).toBe(0)
  })
})
