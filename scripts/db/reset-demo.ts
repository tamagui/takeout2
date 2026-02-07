#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Reset demo database to seed state`.run(async () => {
  // allow self-signed certs for managed databases
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  const { Pool } = await import('pg')

  const connectionString = process.env.ZERO_UPSTREAM_DB
  if (!connectionString) {
    throw new Error('ZERO_UPSTREAM_DB not set')
  }

  // only use ssl for non-localhost connections
  const isLocalhost =
    connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
  const pool = new Pool({
    connectionString,
    ssl: isLocalhost ? false : { rejectUnauthorized: false },
  })

  // seed data ids - these are preserved
  const SEED_USER_IDS = ['seed-user-1', 'seed-user-2', 'seed-user-3', 'seed-user-4']
  const SEED_POST_IDS = ['seed-post-1', 'seed-post-2', 'seed-post-3', 'seed-post-4']
  const SEED_COMMENT_IDS = [
    'seed-comment-1',
    'seed-comment-2',
    'seed-comment-3',
    'seed-comment-4',
    'seed-comment-5',
    'seed-comment-6',
    'seed-comment-7',
    'seed-comment-8',
  ]

  // demo user gets special treatment - keep it but clear its content
  const DEMO_USER_ID = 'demo-user'

  async function resetDemo() {
    console.info('starting demo reset...')
    console.info(`preserving seed users: ${SEED_USER_IDS.join(', ')}`)
    console.info(`preserving seed posts: ${SEED_POST_IDS.join(', ')}`)

    // delete non-seed comments first (foreign key constraints)
    console.info('\ndeleting user-created comments...')
    const commentsResult = await pool.query(
      `DELETE FROM comment WHERE id != ALL($1::text[]) RETURNING id`,
      [SEED_COMMENT_IDS]
    )
    console.info(`  deleted ${commentsResult.rowCount} comments`)

    // delete non-seed posts
    console.info('deleting user-created posts...')
    const postsResult = await pool.query(
      `DELETE FROM post WHERE id != ALL($1::text[]) RETURNING id`,
      [SEED_POST_IDS]
    )
    console.info(`  deleted ${postsResult.rowCount} posts`)

    // delete reports
    console.info('deleting reports...')
    const reportsResult = await pool.query(`DELETE FROM report RETURNING id`)
    console.info(`  deleted ${reportsResult.rowCount} reports`)

    // delete user state for non-seed users (except demo user)
    console.info('deleting user states...')
    const usersToKeep = [...SEED_USER_IDS, DEMO_USER_ID]
    const userStatesResult = await pool.query(
      `DELETE FROM "userState" WHERE "userId" != ALL($1::text[]) RETURNING "userId"`,
      [usersToKeep]
    )
    console.info(`  deleted ${userStatesResult.rowCount} user states`)

    // delete public user profiles for non-seed users (except demo)
    console.info('deleting public user profiles...')
    const userPublicResult = await pool.query(
      `DELETE FROM "userPublic" WHERE id != ALL($1::text[]) RETURNING id`,
      [usersToKeep]
    )
    console.info(`  deleted ${userPublicResult.rowCount} public user profiles`)

    // delete sessions for non-seed users (except demo)
    console.info('deleting sessions...')
    const sessionsResult = await pool.query(
      `DELETE FROM session WHERE "userId" != ALL($1::text[]) RETURNING id`,
      [usersToKeep]
    )
    console.info(`  deleted ${sessionsResult.rowCount} sessions`)

    // delete accounts for non-seed users (except demo)
    console.info('deleting accounts...')
    const accountsResult = await pool.query(
      `DELETE FROM account WHERE "userId" != ALL($1::text[]) RETURNING id`,
      [usersToKeep]
    )
    console.info(`  deleted ${accountsResult.rowCount} accounts`)

    // delete private user records for non-seed users (except demo)
    console.info('deleting user records...')
    const usersResult = await pool.query(
      `DELETE FROM "user" WHERE id != ALL($1::text[]) RETURNING id`,
      [usersToKeep]
    )
    console.info(`  deleted ${usersResult.rowCount} user records`)

    // reset demo user's posts count if they exist
    console.info('\nresetting demo user posts count...')
    await pool.query(`UPDATE "userPublic" SET "postsCount" = 0 WHERE id = $1`, [
      DEMO_USER_ID,
    ])

    // reset seed users' posts counts
    console.info('resetting seed user stats...')
    for (const userId of SEED_USER_IDS) {
      const postCount = SEED_POST_IDS.filter((_, i) => {
        const postUserMap = ['seed-user-1', 'seed-user-2', 'seed-user-3', 'seed-user-4']
        return postUserMap[i] === userId
      }).length

      await pool.query(`UPDATE "userPublic" SET "postsCount" = $1 WHERE id = $2`, [
        postCount,
        userId,
      ])
    }

    // reset comment counts on seed posts
    console.info('resetting seed post comment counts...')
    for (const postId of SEED_POST_IDS) {
      const commentCount = SEED_COMMENT_IDS.filter((_, i) => {
        const commentPostMap = [
          'seed-post-1',
          'seed-post-1',
          'seed-post-2',
          'seed-post-2',
          'seed-post-2',
          'seed-post-3',
          'seed-post-3',
          'seed-post-4',
        ]
        return commentPostMap[i] === postId
      }).length

      await pool.query(`UPDATE post SET "commentCount" = $1 WHERE id = $2`, [
        commentCount,
        postId,
      ])
    }

    console.info('\ndemo reset complete!')
    await pool.end()
    process.exit(0)
  }

  resetDemo().catch((err) => {
    console.error('reset failed:', err)
    process.exit(1)
  })
})
