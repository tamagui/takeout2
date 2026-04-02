#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Analyze Zero indexes and query performance against the dev database`.run(
  async () => {
    const { ports } = await import('~/env')
    const { Pool } = await import('pg')

    const connStr =
      process.env.ZERO_UPSTREAM_DB ||
      `postgresql://user:password@127.0.0.1:${ports.postgres}/postgres`
    const replicaFile = process.env.ZERO_REPLICA_FILE || '/tmp/takeout_replica.db'
    const publication = process.env.ZERO_APP_PUBLICATIONS || 'zero_takeout'

    const pool = new Pool({ connectionString: connStr })

    console.info('\n=== zero index analyzer ===\n')

    // 1. check what indexes exist in postgres
    console.info('--- postgres indexes ---')
    const pgIndexes = await pool.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `)

    const indexesByTable: Record<string, string[]> = {}
    for (const row of pgIndexes.rows) {
      if (!indexesByTable[row.tablename]) indexesByTable[row.tablename] = []
      indexesByTable[row.tablename].push(row.indexname)
      console.info(`  ${row.tablename}.${row.indexname}`)
    }

    // 2. check what zero's publication sees
    console.info('\n--- zero publication indexes ---')
    console.info(`  publication: ${publication}`)

    const pubIndexes = await pool.query(
      `
      WITH indexed_columns AS (
        SELECT
          pg_indexes.tablename,
          pg_indexes.indexname,
          pg_index.indisunique as is_unique,
          array_agg(pg_attribute.attname ORDER BY col.index_pos) as columns,
          CASE WHEN pg_constraint.contype = 'p' THEN 'PRIMARY KEY'
               WHEN pg_constraint.contype = 'u' THEN 'UNIQUE'
               ELSE 'INDEX' END as index_type,
          pg_index.indexprs IS NOT NULL as is_expression,
          pg_index.indpred IS NOT NULL as is_partial
        FROM pg_indexes
        JOIN pg_namespace ON pg_indexes.schemaname = pg_namespace.nspname
        JOIN pg_class pc ON pc.relname = pg_indexes.indexname AND pc.relnamespace = pg_namespace.oid
        JOIN pg_publication_tables pb ON pb.schemaname = pg_indexes.schemaname AND pb.tablename = pg_indexes.tablename
        JOIN pg_index ON pg_index.indexrelid = pc.oid
        JOIN LATERAL (
          SELECT pg_attribute.attname, col.index_pos
          FROM UNNEST((pg_index.indkey::smallint[])[:pg_index.indnkeyatts - 1])
            WITH ORDINALITY as col(table_pos, index_pos)
          JOIN pg_attribute ON attrelid = pg_index.indrelid AND attnum = col.table_pos
        ) AS col ON true
        JOIN pg_attribute ON pg_attribute.attrelid = pg_index.indrelid AND pg_attribute.attname = col.attname
        LEFT JOIN pg_constraint ON pg_constraint.conindid = pc.oid
        WHERE pb.pubname = $1
          AND pg_indexes.schemaname = 'public'
        GROUP BY pg_indexes.tablename, pg_indexes.indexname, pg_index.indisunique,
                 pg_constraint.contype, pg_index.indexprs, pg_index.indpred
        ORDER BY pg_indexes.tablename, pg_indexes.indexname
      )
      SELECT * FROM indexed_columns
    `,
      [publication],
    )

    let replicatedCount = 0
    let skippedCount = 0

    for (const row of pubIndexes.rows) {
      const willReplicate = !row.is_expression && !row.is_partial
      const status = willReplicate ? '✅' : '⚠️  SKIPPED'
      const reason = row.is_expression
        ? '(expression index)'
        : row.is_partial
          ? '(partial index)'
          : ''

      if (willReplicate) replicatedCount++
      else skippedCount++

      const cols = Array.isArray(row.columns)
        ? row.columns.join(', ')
        : String(row.columns)
      console.info(
        `  ${status} ${row.tablename}.${row.indexname} [${row.index_type}] (${cols}) ${reason}`,
      )
    }

    console.info(`\n  replicated: ${replicatedCount}, skipped: ${skippedCount}`)

    // 3. check sqlite replica if it exists
    console.info('\n--- sqlite replica indexes ---')
    try {
      const { Database } = await import('bun:sqlite')
      const db = new Database(replicaFile, { readonly: true })

      const sqliteIndexes = db
        .query(`
        SELECT name, tbl_name, sql FROM sqlite_master
        WHERE type = 'index' AND sql IS NOT NULL
        ORDER BY tbl_name, name
      `)
        .all() as { name: string; tbl_name: string; sql: string }[]

      if (sqliteIndexes.length === 0) {
        console.info('  (no indexes found - replica may not exist yet)')
      }

      const sqliteByTable: Record<string, string[]> = {}
      for (const row of sqliteIndexes) {
        if (!sqliteByTable[row.tbl_name]) sqliteByTable[row.tbl_name] = []
        sqliteByTable[row.tbl_name].push(row.name)
        console.info(`  ${row.tbl_name}.${row.name}`)
      }

      // 4. diff - find indexes in postgres but missing in sqlite
      console.info('\n--- missing from sqlite replica ---')
      let missingCount = 0
      for (const row of pubIndexes.rows) {
        if (row.is_expression || row.is_partial) continue
        const sqliteNames = sqliteByTable[row.tablename] || []
        const found = sqliteNames.some(
          (n) => n === row.indexname || n.includes(row.indexname),
        )
        if (!found) {
          missingCount++
          console.info(
            `  ❌ ${row.tablename}.${row.indexname} (${row.columns.join(', ')})`,
          )
        }
      }
      if (missingCount === 0) {
        console.info('  all published indexes present in sqlite ✅')
      } else {
        console.info(`\n  ${missingCount} indexes missing from sqlite replica!`)
      }

      db.close()
    } catch (e) {
      console.info(`  could not open sqlite replica at ${replicaFile}: ${e}`)
    }

    // 5. analyze table sizes and stats
    console.info('\n--- table stats ---')
    const tableStats = await pool.query(`
      SELECT
        relname as table_name,
        n_live_tup as row_count,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
    `)

    for (const row of tableStats.rows) {
      const deadPct =
        row.row_count > 0 ? ((row.dead_rows / row.row_count) * 100).toFixed(1) : '0'
      console.info(
        `  ${row.table_name}: ${row.row_count} rows (${row.dead_rows} dead, ${deadPct}% bloat)`,
      )
    }

    // 6. find sequential scans (missing index indicators)
    console.info('\n--- sequential scan hotspots ---')
    const seqScans = await pool.query(`
      SELECT
        relname as table_name,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch,
        CASE WHEN (seq_scan + COALESCE(idx_scan, 0)) > 0
          THEN round(100.0 * seq_scan / (seq_scan + COALESCE(idx_scan, 0)), 1)
          ELSE 0 END as seq_pct
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
        AND (seq_scan + COALESCE(idx_scan, 0)) > 0
      ORDER BY seq_tup_read DESC
    `)

    for (const row of seqScans.rows) {
      const flag = row.seq_pct > 50 && row.seq_scan > 10 ? '⚠️ ' : '  '
      console.info(
        `${flag}${row.table_name}: seq=${row.seq_scan} idx=${row.idx_scan || 0} (${row.seq_pct}% sequential)`,
      )
    }

    // 7. index usage stats - find unused indexes
    console.info('\n--- index usage ---')
    const indexUsage = await pool.query(`
      SELECT
        relname as table_name,
        indexrelname as index_name,
        idx_scan as scans,
        idx_tup_read as rows_read,
        idx_tup_fetch as rows_fetched,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan ASC
    `)

    for (const row of indexUsage.rows) {
      const flag = row.scans === 0 ? '⚠️  UNUSED ' : '  '
      console.info(
        `${flag}${row.table_name}.${row.index_name}: ${row.scans} scans, ${row.rows_read} rows read (${row.index_size})`,
      )
    }

    // 8. run explain analyze on the actual queries the app uses
    console.info('\n--- query plan analysis ---')

    const queries: { name: string; sql: string }[] = [
      {
        name: 'feed posts (ordered by createdAt)',
        sql: `EXPLAIN ANALYZE SELECT * FROM post ORDER BY "createdAt" DESC LIMIT 20`,
      },
      {
        name: 'posts by user',
        sql: `EXPLAIN ANALYZE SELECT * FROM post WHERE "userId" = 'test-user' ORDER BY "createdAt" DESC LIMIT 20`,
      },
      {
        name: 'comments by post',
        sql: `EXPLAIN ANALYZE SELECT * FROM comment WHERE "postId" = 'test-post' ORDER BY "createdAt" ASC LIMIT 50`,
      },
      {
        name: 'unread notifications',
        sql: `EXPLAIN ANALYZE SELECT * FROM notification WHERE "userId" = 'test-user' AND read = false ORDER BY "createdAt" DESC`,
      },
      {
        name: 'blocks check (exists subquery pattern)',
        sql: `EXPLAIN ANALYZE SELECT p.* FROM post p WHERE NOT EXISTS (SELECT 1 FROM block b WHERE b."blockedId" = p."userId" AND b."blockerId" = 'test-viewer')
          ORDER BY p."createdAt" DESC LIMIT 20`,
      },
      {
        name: 'user lookup by username',
        sql: `EXPLAIN ANALYZE SELECT * FROM "userPublic" WHERE username = 'test-user'`,
      },
      {
        name: 'notification count (unread)',
        sql: `EXPLAIN ANALYZE SELECT count(*) FROM notification WHERE "userId" = 'test-user' AND read = false`,
      },
      {
        name: 'post with comments join',
        sql: `EXPLAIN ANALYZE SELECT p.*, c.id as comment_id, c.content
          FROM post p LEFT JOIN comment c ON c."postId" = p.id
          WHERE p.id = 'test-post'
          ORDER BY c."createdAt" ASC LIMIT 50`,
      },
    ]

    for (const q of queries) {
      console.info(`\n  [${q.name}]`)
      try {
        const result = await pool.query(q.sql)
        const plan = result.rows.map((r: any) => r['QUERY PLAN']).join('\n')

        // extract key metrics
        const seqScanMatch = plan.match(/Seq Scan/g)
        const executionTime = plan.match(/Execution Time: ([\d.]+)/)?.[1]
        const planningTime = plan.match(/Planning Time: ([\d.]+)/)?.[1]

        if (seqScanMatch) {
          console.info(`  ⚠️  sequential scan detected (${seqScanMatch.length}x)`)
        }
        console.info(
          `  planning: ${planningTime || '?'}ms, execution: ${executionTime || '?'}ms`,
        )

        // print abbreviated plan
        for (const line of plan.split('\n')) {
          if (
            line.includes('Scan') ||
            line.includes('Sort') ||
            line.includes('Execution Time') ||
            line.includes('Planning Time') ||
            line.includes('rows=')
          ) {
            console.info(`  ${line.trim()}`)
          }
        }
      } catch {
        console.info('  (query failed - table may be empty or not exist)')
      }
    }

    // 9. suggest missing indexes based on query patterns
    console.info('\n--- index recommendations ---')

    const recommendations: string[] = []

    // check if username has an index (used in userByUsername query)
    const usernameIdx = pgIndexes.rows.find(
      (r) => r.tablename === 'userPublic' && r.indexdef?.includes('username'),
    )
    if (!usernameIdx) {
      recommendations.push(
        'CREATE INDEX "userPublic_username_idx" ON "userPublic" ("username") -- userByUsername query does full scan',
      )
    }

    // check notification composite for the triple filter pattern
    const notifTriple = pgIndexes.rows.find(
      (r) =>
        r.tablename === 'notification' &&
        r.indexdef?.includes('userId') &&
        r.indexdef?.includes('read') &&
        r.indexdef?.includes('createdAt'),
    )
    if (!notifTriple) {
      recommendations.push(
        'CREATE INDEX "notification_userId_read_createdAt_idx" ON notification ("userId", read, "createdAt" DESC) -- newNotificationsSince triple filter',
      )
    }

    // check post composite for the common feed pattern
    const postComposite = pgIndexes.rows.find(
      (r) =>
        r.tablename === 'post' &&
        r.indexdef?.includes('createdAt') &&
        r.indexdef?.includes('id') &&
        r.indexdef?.includes('DESC'),
    )
    if (!postComposite) {
      recommendations.push(
        'CREATE INDEX "post_createdAt_id_desc_idx" ON post ("createdAt" DESC, id DESC) -- feed pagination cursor',
      )
    }

    // check comment ordering
    const commentCreatedAt = pgIndexes.rows.find(
      (r) =>
        r.tablename === 'comment' &&
        r.indexdef?.includes('postId') &&
        r.indexdef?.includes('createdAt'),
    )
    if (!commentCreatedAt) {
      recommendations.push(
        'CREATE INDEX "comment_postId_createdAt_idx" ON comment ("postId", "createdAt" ASC) -- comments ordered by time',
      )
    }

    // check notification actorId (used in related('actor'))
    const notifActorIdx = pgIndexes.rows.find(
      (r) => r.tablename === 'notification' && r.indexdef?.includes('actorId'),
    )
    if (!notifActorIdx) {
      recommendations.push(
        'CREATE INDEX "notification_actorId_idx" ON notification ("actorId") -- actor relationship lookup',
      )
    }

    if (recommendations.length === 0) {
      console.info('  no obvious missing indexes detected ✅')
    } else {
      console.info(`  found ${recommendations.length} potential improvements:\n`)
      for (const rec of recommendations) {
        console.info(`  ${rec}`)
      }
    }

    // 10. summary
    console.info('\n--- summary ---')
    console.info(`  postgres indexes: ${pgIndexes.rows.length}`)
    console.info(`  published to zero: ${replicatedCount} (${skippedCount} skipped)`)
    console.info(`  recommendations: ${recommendations.length}`)

    await pool.end()
    console.info('\ndone.\n')
  },
)
