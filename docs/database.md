---
name: takeout-database
description: Database guide for PostgreSQL, Drizzle ORM, and Zero sync. Drizzle, migrations, schema changes, ALTER TABLE, SQL queries, getDb, getDBClient, queryDb, connection pooling, Aurora, pgvector, vector search.
---

# Database

This guide covers the database architecture, tools, and patterns used in this
codebase.

## Overview

The application uses PostgreSQL as its primary database with multiple access
patterns and tools:

PostgreSQL - primary database (locally via Docker, production via AWS Aurora
Serverless v2) Drizzle ORM - type-safe ORM for schema management pgvector -
vector database extension for semantic search Zero - real-time sync system with
its own database requirements pg - direct PostgreSQL client for custom queries

## Local Development

### Database GUI - TablePlus

TablePlus is the recommended database GUI for macOS. It provides a clean, native
macOS interface, support for multiple database types, query editor with syntax
highlighting, import/export capabilities, and SSH tunnel support for production
databases.

To connect to your local development database:

Open TablePlus, create a new PostgreSQL connection, and use the connection
string from `ZERO_UPSTREAM_DB` environment variable. Default local connection:
`postgresql://user:password@127.0.0.1:5433/postgres`

### Command Line Access

```bash
# connect to local database
bun env:dev bunx postgres psql

# run a query
bun env:dev bunx postgres psql --query "SELECT * FROM users LIMIT 5"
```

## Query Patterns

The codebase uses multiple query patterns depending on the use case.

### Drizzle ORM via getDb()

Standard ORM queries for type-safe database operations:

```typescript
import { getDb } from '~/database'
import { users } from '~/database/schema-public'

const db = getDb()
const allUsers = await db.select().from(users)
```

Location: src/database/index.ts:28

### Direct SQL with Template Literals

For complex queries using the sql helper:

```typescript
import { sql } from '~/database/sql'

const result = await sql`
  SELECT * FROM users
  WHERE created_at > ${date}
  ORDER BY created_at DESC
`
```

Location: src/database/sql.ts:10

### Raw pg Client via getDBClient()

For connection pooling and advanced PostgreSQL features:

```typescript
import { getDBClient, queryDb } from '~/database/helpers'

const client = await getDBClient()
try {
  const result = await client.query('SELECT * FROM users')
} finally {
  client.release()
}

const result = await queryDb('SELECT * FROM users WHERE id = $1', [userId])
```

Location: src/database/getDBClient.ts:36

## Production Infrastructure (AWS Aurora)

The production database runs on AWS Aurora Serverless v2 with PostgreSQL 16.6.
Configuration defined in sst.config.ts.

### Connection Management

The application implements sophisticated connection pooling to handle Aurora's
connection limits:

Connection pool with retry logic (src/database/getDBClient.ts:36), automatic
connection limit monitoring, pool recycling when approaching limits,
configurable timeouts and retry strategies.

## Migrations

We have a unified migration system that combines Drizzle schema migrations with
custom TypeScript migrations. You don't need to touch Drizzle directly.

### Migration Workflow

1. Edit `src/database/schema-public.ts` or `src/database/schema-private.ts`
2. Run migrations:

```bash
# local development - generates and runs migrations
bun migrate run

# production - just generates and builds (CI deploys)
bun migrate build
```

### Custom Migrations

For data migrations or complex changes that can't be expressed in schema:

```bash
bun db:add-migration update-user-stats
```

This creates a TypeScript migration file:

```typescript
import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  await client.query(`
    UPDATE users SET email = lower(email)
  `)
}
```

We don't do down migrations.

### Troubleshooting

**Migration file is blank/empty:**
Drizzle found no schema changes. Either your changes aren't saved, or the schema
already matches the database. Check your schema file and compare with what's in
the database.

**Check which migrations have run:**
```bash
bun env:dev bunx postgres psql --query "SELECT * FROM migrations ORDER BY id"
```

**Migration failed and left database in bad state:**
Migrations run in a transaction, so failed migrations should rollback
automatically. If you need to manually fix:

1. Check what migrations have run (query above)
2. If a bad migration was applied, write a new migration to fix it
3. If the migration is stuck in a partial state, you may need to manually delete
   from the migrations table and fix the schema:
   ```sql
   DELETE FROM migrations WHERE name = '0003_bad_migration';
   ```

**Schema changes not being detected:**
- Make sure you're editing the right file (`schema-public.ts` vs `schema-private.ts`)
- Both schemas go to Drizzle - "private" just means auth tables, not "excluded from migrations"
- Run `bun migrate run` which regenerates migrations fresh

### Generated Columns in PostgreSQL

When creating generated columns:

Correct syntax for adding generated columns:

```sql
ALTER TABLE "table_name"
ADD COLUMN "column_name" data_type
GENERATED ALWAYS AS (expression) STORED;
```

Modifying existing columns to be generated: first drop the existing column, then
add it back as generated. Cannot directly convert a regular column to generated.

In Drizzle schema (src/database/schema-public.ts):

```typescript
columnName: t.integer().generatedAlwaysAs(sql`expression`)
```

## Zero Database Requirements

Zero requires specific database configuration:

Three separate databases: main, CVR, and change tracking. Logical replication
enabled. Connection strings configured via environment: ZERO_UPSTREAM_DB (main
database), ZERO_CVR_DB (client view records), ZERO_CHANGE_DB (change tracking).

## Best Practices

Connection Management: always release clients when using getDBClient(), use
queryDb() helper for one-off queries, monitor connection pool usage in
production.

Migrations: test migrations locally before production, use transactions for data
migrations.

Query Performance: use indexes for frequently queried columns, monitor slow
queries via Aurora logs, use EXPLAIN ANALYZE for query optimization.

Security: never log sensitive data, use parameterized queries to prevent SQL
injection, keep connection strings in environment variables.

## Integration Testing

For information on database state management during integration testing, see the
Integration Testing Guide (./testing-integration.md).
