#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Seed database with demo users and posts`.run(async () => {
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

  const seedUsers = [
    {
      id: 'seed-user-1',
      name: 'Sarah Chen',
      username: 'sarahc',
      email: 'sarah@example.com',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    },
    {
      id: 'seed-user-2',
      name: 'Marcus Johnson',
      username: 'marcusj',
      email: 'marcus@example.com',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    },
    {
      id: 'seed-user-3',
      name: 'Emma Wilson',
      username: 'emmaw',
      email: 'emma@example.com',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    },
    {
      id: 'seed-user-4',
      name: 'Alex Rivera',
      username: 'alexr',
      email: 'alex@example.com',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    },
  ]

  const seedPosts = [
    {
      id: 'seed-post-1',
      userId: 'seed-user-1',
      image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200',
      imageWidth: 1200,
      imageHeight: 800,
      caption: 'morning coffee vibes',
    },
    {
      id: 'seed-post-2',
      userId: 'seed-user-2',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
      imageWidth: 1200,
      imageHeight: 800,
      caption: 'caught this sunset on my hike today',
    },
    {
      id: 'seed-post-3',
      userId: 'seed-user-3',
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200',
      imageWidth: 1200,
      imageHeight: 799,
      caption: 'someone wanted to say hi',
    },
    {
      id: 'seed-post-4',
      userId: 'seed-user-4',
      image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200',
      imageWidth: 1200,
      imageHeight: 799,
      caption: 'city lights never get old',
    },
  ]

  const seedComments = [
    {
      id: 'seed-comment-1',
      postId: 'seed-post-1',
      userId: 'seed-user-2',
      content: 'love this! ☕',
    },
    {
      id: 'seed-comment-2',
      postId: 'seed-post-1',
      userId: 'seed-user-3',
      content: 'perfect way to start the day',
    },
    {
      id: 'seed-comment-3',
      postId: 'seed-post-2',
      userId: 'seed-user-1',
      content: 'stunning view!',
    },
    {
      id: 'seed-comment-4',
      postId: 'seed-post-2',
      userId: 'seed-user-4',
      content: 'where is this?',
    },
    {
      id: 'seed-comment-5',
      postId: 'seed-post-2',
      userId: 'seed-user-3',
      content: 'need to visit',
    },
    {
      id: 'seed-comment-6',
      postId: 'seed-post-3',
      userId: 'seed-user-1',
      content: 'so cute!',
    },
    {
      id: 'seed-comment-7',
      postId: 'seed-post-3',
      userId: 'seed-user-2',
      content: 'adorable 🐕',
    },
    {
      id: 'seed-comment-8',
      postId: 'seed-post-4',
      userId: 'seed-user-3',
      content: 'great shot',
    },
  ]

  async function seed() {
    const now = new Date().toISOString()

    // demo user is created lazily via signInAsDemo helper, no need to seed it

    console.info('seeding users...')

    for (const u of seedUsers) {
      const postsCount = seedPosts.filter((p) => p.userId === u.id).length

      // insert into private user table (auth)
      await pool.query(
        `INSERT INTO "user" (id, name, username, email, "emailVerified", image, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [u.id, u.name, u.username, u.email, true, u.image, 'user']
      )

      // insert into public user table
      await pool.query(
        `INSERT INTO "userPublic" (id, name, username, image, "joinedAt", "hasOnboarded", whitelisted, "migrationVersion", "postsCount")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [u.id, u.name, u.username, u.image, now, true, true, 0, postsCount]
      )

      // insert user state
      await pool.query(
        `INSERT INTO "userState" ("userId", "darkMode", locale, "timeZone", "onlineStatus")
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT ("userId") DO NOTHING`,
        [u.id, false, 'en', 'UTC', 'online']
      )

      console.info(`  created user: ${u.username}`)
    }

    console.info('seeding posts...')

    for (const p of seedPosts) {
      await pool.query(
        `INSERT INTO post (id, "userId", image, "imageWidth", "imageHeight", caption, "hiddenByAdmin", "createdAt", "commentCount")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET "imageWidth" = $4, "imageHeight" = $5`,
        [p.id, p.userId, p.image, p.imageWidth, p.imageHeight, p.caption, false, now, 0]
      )

      console.info(`  created post: ${p.id}`)
    }

    console.info('seeding comments...')

    for (const c of seedComments) {
      await pool.query(
        `INSERT INTO comment (id, "postId", "userId", content, "createdAt")
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.postId, c.userId, c.content, now]
      )

      console.info(`  created comment: ${c.id}`)
    }

    console.info('done!')
    await pool.end()
    process.exit(0)
  }

  seed().catch((err) => {
    console.error('seed failed:', err)
    process.exit(1)
  })
})
