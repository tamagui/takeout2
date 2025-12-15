---
name: database
description: Database guide. Use when working with PostgreSQL, Drizzle ORM, migrations, schema, pgvector, Aurora, or direct SQL queries.
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
bun db:psql:dev
QUERY="SELECT * FROM users LIMIT 5" bun db:psql:dev
bun db:psql:dev -c "SELECT COUNT(*) FROM messages"
```

### Database Migrations

```bash
bun db:migrate:add my-migration-name
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

We use Drizzle only for schema migrations, but we often go outside of it for our
own migration system which is designed to be very simple and builds so it runs
locally and on AWS Lambda, when deploying to production.

### Migration Workflow

For Drizzle schame changes in schema-public or schema-private, you just change
the file and run `bun migrate:build`.

If you're developing locally you can skip this and build and run migrations at
the same time using `bun migrate`.

### Custom migrations

```bash
bun db:migrate:add update-user-stats
bun migrate
bun migrate:production
```

### Custom Migration Example

Location: src/database/scripts/migration-add.ts:37

```typescript
import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  await client.query(`
    ALTER TABLE users
    ADD COLUMN last_seen TIMESTAMP
  `)
}
```

We don't do down migrations.

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
