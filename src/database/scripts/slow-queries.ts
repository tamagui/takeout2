#!/usr/bin/env bun

import '../../../scripts/ensure-tunnel'

import { Resource } from 'sst'
import { Client } from 'pg'

async function main() {
  console.info('🔍 Slow Query Analysis')
  console.info(`Database: ${Resource.Postgres2.database} on ${Resource.Postgres2.host}\n`)

  const client = new Client({
    host: Resource.Postgres2.host,
    port: Resource.Postgres2.port,
    database: Resource.Postgres2.database,
    user: Resource.Postgres2.username,
    password: Resource.Postgres2.password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  try {
    console.info('⏳ Connecting to database...')
    await client.connect()
    console.info('✅ Connected to database\n')

    // check if pg_stat_statements extension is enabled
    const extensionCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
      ) as enabled
    `)

    if (!extensionCheck.rows[0].enabled) {
      console.warn('⚠️  pg_stat_statements extension is not enabled')
      console.warn('Enable it with: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;')
      process.exit(1)
    }

    // get slow queries from pg_stat_statements
    const result = await client.query(`
      SELECT
        query,
        calls,
        ROUND(total_exec_time::numeric, 2) as total_time_ms,
        ROUND(mean_exec_time::numeric, 2) as mean_time_ms,
        ROUND(max_exec_time::numeric, 2) as max_time_ms,
        ROUND(stddev_exec_time::numeric, 2) as stddev_time_ms,
        ROUND((100.0 * total_exec_time / SUM(total_exec_time) OVER ())::numeric, 2) as pct_total_time,
        rows
      FROM pg_stat_statements
      WHERE query NOT ILIKE '%pg_stat_statements%'
        AND query NOT ILIKE '%pg_catalog%'
        AND dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
      ORDER BY total_exec_time DESC
      LIMIT 20
    `)

    console.info('📊 Top 20 Slowest Queries (by total execution time):\n')
    console.info('─'.repeat(120))

    for (const [i, row] of result.rows.entries()) {
      const query = row.query.trim().replace(/\s+/g, ' ').substring(0, 80)
      console.info(`\n${i + 1}. ${query}${row.query.length > 80 ? '...' : ''}`)
      console.info(
        `   Calls: ${row.calls.toLocaleString()} | Total: ${row.total_time_ms}ms | Mean: ${row.mean_time_ms}ms | Max: ${row.max_time_ms}ms`
      )
      console.info(
        `   % of total time: ${row.pct_total_time}% | Rows: ${row.rows.toLocaleString()}`
      )
    }

    console.info('\n' + '─'.repeat(120))

    // get currently running queries
    const runningQueries = await client.query(`
      SELECT
        pid,
        now() - pg_stat_activity.query_start AS duration,
        query,
        state
      FROM pg_stat_activity
      WHERE state != 'idle'
        AND query NOT ILIKE '%pg_stat_activity%'
        AND pid != pg_backend_pid()
      ORDER BY duration DESC
      LIMIT 10
    `)

    if (runningQueries.rows.length > 0) {
      console.info('\n\n🏃 Currently Running Queries:\n')
      console.info('─'.repeat(120))

      for (const [i, row] of runningQueries.rows.entries()) {
        const query = row.query.trim().replace(/\s+/g, ' ').substring(0, 80)
        const duration = row.duration ? Math.round(row.duration.seconds * 1000) : 0
        console.info(
          `\n${i + 1}. [PID: ${row.pid}] ${query}${row.query.length > 80 ? '...' : ''}`
        )
        console.info(`   Duration: ${duration}ms | State: ${row.state}`)
      }

      console.info('\n' + '─'.repeat(120))
    }

    // get table statistics
    const tableStats = await client.query(`
      SELECT
        schemaname,
        tablename,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch,
        n_tup_ins,
        n_tup_upd,
        n_tup_del,
        n_live_tup,
        n_dead_tup
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY seq_scan DESC
      LIMIT 10
    `)

    console.info('\n\n📋 Top 10 Tables by Sequential Scans:\n')
    console.info('─'.repeat(120))

    for (const [i, row] of tableStats.rows.entries()) {
      console.info(`\n${i + 1}. ${row.tablename}`)
      console.info(
        `   Seq scans: ${row.seq_scan.toLocaleString()} (${row.seq_tup_read.toLocaleString()} rows) | Index scans: ${(row.idx_scan || 0).toLocaleString()} (${(row.idx_tup_fetch || 0).toLocaleString()} rows)`
      )
      console.info(
        `   Live tuples: ${row.n_live_tup.toLocaleString()} | Dead tuples: ${row.n_dead_tup.toLocaleString()}`
      )
    }

    console.info('\n' + '─'.repeat(120))

    console.info('\n\n💡 Tips:')
    console.info('- High sequential scans may indicate missing indexes')
    console.info('- High dead tuples may require VACUUM')
    console.info('- Reset statistics with: SELECT pg_stat_statements_reset();')
    console.info('- Get query plan with: EXPLAIN ANALYZE <query>;')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
