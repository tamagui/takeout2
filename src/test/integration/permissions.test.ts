import { randomUUID } from 'node:crypto'

import { expect, test, type Page } from '@playwright/test'
import { Pool } from 'pg'

import { loginAsDemo } from './helpers'

const BASE_URL = 'http://localhost:8081'
const DB_URL =
  process.env.ZERO_UPSTREAM_DB || 'postgresql://user:password@127.0.0.1:5433/postgres'

// seed data from scripts/db/seed-demo.ts
const SEED_USER_1 = 'seed-user-1' // sarah - owns seed-post-1
const SEED_USER_2 = 'seed-user-2' // marcus - owns seed-post-2
const SEED_POST_1 = 'seed-post-1' // owned by seed-user-1
const SEED_POST_2 = 'seed-post-2' // owned by seed-user-2

let pool: Pool

test.beforeAll(() => {
  pool = new Pool({
    connectionString: DB_URL,
    ssl: false,
  })
})

test.afterAll(async () => {
  await pool.end()
})

async function openTestUI(page: Page) {
  await page.keyboard.press('Control+Shift+Alt+p')
  await page
    .locator('[data-testid="zero-test-ui"]')
    .waitFor({ state: 'visible', timeout: 5000 })
}

async function getTestValue(page: Page, label: string): Promise<string> {
  const el = page.locator(`[data-testid="zt-${label}"]`)
  await el.waitFor({ state: 'attached', timeout: 5000 })
  return (await el.textContent()) ?? ''
}

async function waitForPostVisible(page: Page, postId: string, timeout = 5000) {
  await expect(page.locator(`[data-testid="post-card-${postId}"]`)).toBeVisible({
    timeout,
  })
}

async function waitForPostHidden(page: Page, postId: string, timeout = 5000) {
  await expect(page.locator(`[data-testid="post-card-${postId}"]`)).toBeHidden({
    timeout,
  })
}

async function insertBlock(blockerId: string, blockedId: string): Promise<string> {
  const id = `test-block-${randomUUID()}`
  await pool.query(
    `INSERT INTO block (id, "blockerId", "blockedId", "createdAt")
     VALUES ($1, $2, $3, NOW())`,
    [id, blockerId, blockedId]
  )
  return id
}

async function deleteBlock(blockId: string) {
  await pool.query(`DELETE FROM block WHERE id = $1`, [blockId])
}

async function cleanupTestBlocks() {
  await pool.query(`DELETE FROM block WHERE id LIKE 'test-block-%'`)
}

test.describe('Permissions', () => {
  test.afterEach(async () => {
    await cleanupTestBlocks()
  })

  test('notBlockedByViewer: blocking hides posts, unblocking restores them', async ({
    page,
  }) => {
    test.setTimeout(60000)

    await loginAsDemo(page)
    await page.goto(`${BASE_URL}/home/feed`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // seed posts should be visible before blocking
    await waitForPostVisible(page, SEED_POST_1)
    await waitForPostVisible(page, SEED_POST_2)

    // open test ui to get demo user id
    await openTestUI(page)

    // wait for test ui to populate
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="zt-user-id"]')
        return el && el.textContent && el.textContent !== '—'
      },
      { timeout: 5000 }
    )

    const demoUserId = await getTestValue(page, 'user-id')
    expect(demoUserId).toBeTruthy()
    expect(demoUserId).not.toBe('—')

    // verify seed-post-1 is in the visible post ids
    const visibleBefore = await getTestValue(page, 'visible-post-ids')
    expect(visibleBefore).toContain(SEED_POST_1)
    expect(visibleBefore).toContain(SEED_POST_2)

    // block seed-user-1 (author of seed-post-1)
    const blockId = await insertBlock(demoUserId, SEED_USER_1)

    // wait for zero to sync the block and filter out blocked user's posts
    // the post card should disappear from the feed
    await waitForPostHidden(page, SEED_POST_1, 5000)

    // seed-post-2 (different author) should still be visible
    await waitForPostVisible(page, SEED_POST_2)

    // verify via test ui
    const visibleAfterBlock = await getTestValue(page, 'visible-post-ids')
    expect(visibleAfterBlock).not.toContain(SEED_POST_1)
    expect(visibleAfterBlock).toContain(SEED_POST_2)

    // unblock seed-user-1
    await deleteBlock(blockId)

    // posts should reappear after unblock syncs
    await waitForPostVisible(page, SEED_POST_1, 5000)
    await waitForPostVisible(page, SEED_POST_2)

    // verify via test ui
    const visibleAfterUnblock = await getTestValue(page, 'visible-post-ids')
    expect(visibleAfterUnblock).toContain(SEED_POST_1)
    expect(visibleAfterUnblock).toContain(SEED_POST_2)
  })

  test('usePermission: true for own post, false for other user post', async ({
    page,
  }) => {
    test.setTimeout(60000)

    await loginAsDemo(page)
    await page.goto(`${BASE_URL}/home/feed`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await openTestUI(page)

    // wait for permissions to resolve from server (not null)
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="zt-perm-seed-post-1"]')
        return el && el.textContent !== 'null' && el.textContent !== '—'
      },
      { timeout: 5000 }
    )

    // seed-post-1 is owned by seed-user-1, not demo user -> should be false
    const permSeedPost1 = await getTestValue(page, 'perm-seed-post-1')
    expect(permSeedPost1).toBe('false')

    // seed-post-2 is owned by seed-user-2, not demo user -> should be false
    const permSeedPost2 = await getTestValue(page, 'perm-seed-post-2')
    expect(permSeedPost2).toBe('false')

    // perm-other-post should be false (any post not owned by demo user)
    const permOther = await getTestValue(page, 'perm-other-post')
    expect(permOther).toBe('false')
  })

  test('usePermission: true for own post after creating one', async ({ page }) => {
    test.setTimeout(60000)

    await loginAsDemo(page)
    await page.goto(`${BASE_URL}/home/feed`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await openTestUI(page)

    // wait for test ui to load
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="zt-user-id"]')
        return el && el.textContent && el.textContent !== '—'
      },
      { timeout: 5000 }
    )

    const demoUserId = await getTestValue(page, 'user-id')

    // insert a post owned by the demo user directly via pg
    const testPostId = `test-post-${randomUUID()}`
    await pool.query(
      `INSERT INTO post (id, "userId", image, "imageWidth", "imageHeight", caption, "hiddenByAdmin", "createdAt", "commentCount")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)`,
      [
        testPostId,
        demoUserId,
        'https://example.com/test.jpg',
        400,
        400,
        'test post for permissions',
        false,
        0,
      ]
    )

    // wait for the post to appear
    await waitForPostVisible(page, testPostId, 5000)

    // wait for perm-own-post to resolve
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="zt-perm-own-post"]')
        return el && el.textContent !== 'null' && el.textContent !== '—'
      },
      { timeout: 5000 }
    )

    // permission on own post should be true
    const permOwn = await getTestValue(page, 'perm-own-post')
    expect(permOwn).toBe('true')

    // clean up
    await pool.query(`DELETE FROM post WHERE id = $1`, [testPostId])
  })

  test('notBlockedByViewer: blocking multiple users hides all their posts', async ({
    page,
  }) => {
    test.setTimeout(60000)

    await loginAsDemo(page)
    await page.goto(`${BASE_URL}/home/feed`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await openTestUI(page)

    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="zt-user-id"]')
        return el && el.textContent && el.textContent !== '—'
      },
      { timeout: 5000 }
    )

    const demoUserId = await getTestValue(page, 'user-id')

    // both seed posts visible initially
    await waitForPostVisible(page, SEED_POST_1)
    await waitForPostVisible(page, SEED_POST_2)

    // block both seed users
    const blockId1 = await insertBlock(demoUserId, SEED_USER_1)
    const blockId2 = await insertBlock(demoUserId, SEED_USER_2)

    // both posts should disappear
    await waitForPostHidden(page, SEED_POST_1, 5000)
    await waitForPostHidden(page, SEED_POST_2, 5000)

    // unblock user 1 only
    await deleteBlock(blockId1)

    // seed-post-1 reappears, seed-post-2 stays hidden
    await waitForPostVisible(page, SEED_POST_1, 5000)
    await waitForPostHidden(page, SEED_POST_2)

    // unblock user 2
    await deleteBlock(blockId2)

    // both visible again
    await waitForPostVisible(page, SEED_POST_1, 5000)
    await waitForPostVisible(page, SEED_POST_2, 5000)
  })
})
