# @take-out/postgres

PostgreSQL database utilities and migration system for vxrn applications.

Note: feel free to eject from this package and just copy parts of it out, it's
not the most flexible abstraction just meant to provide a starting point.

## Features

- **Connection Management**: Production-grade PostgreSQL connection pooling with
  retry logic and monitoring
- **Migration System**: Support for both SQL (Drizzle Kit) and TypeScript
  migrations
- **Database Utilities**: Chunked query processing, SQL template helpers, and
  more
- **CLI Tools**: Interactive psql, pg_dump wrappers, and migration commands
- **Type Safety**: Full TypeScript support with Drizzle ORM integration

## Installation

```bash
bun add @take-out/postgres
```

## Usage

### Basic Setup

```typescript
import { createPool, createDb } from '@take-out/postgres'
import * as schema from './schema'

// create raw pg pool
const pool = createPool(process.env.DATABASE_URL)

// create drizzle instance with schema
const db = createDb(process.env.DATABASE_URL, schema)
```

### Connection Management

```typescript
import { getDBClient, queryDb } from '@take-out/postgres/helpers'

// get client with automatic retry and monitoring
const client = await getDBClient()
try {
  await client.query('SELECT * FROM users')
} finally {
  client.release()
}

// or use queryDb for automatic client management
const result = await queryDb('SELECT * FROM users WHERE id = $1', [userId])
```

### SQL Template Helper

```typescript
import { sql } from '@take-out/postgres'

const users = await sql<User>`
  SELECT * FROM users WHERE created_at > ${since}
`
```

### Chunked Query Processing

```typescript
import { processInChunks, updateInChunks } from '@take-out/postgres/helpers'

// process large datasets in chunks
await processInChunks(
  'SELECT * FROM users',
  async (rows) => {
    for (const user of rows) {
      await processUser(user)
    }
  },
  { chunkSize: 1000 },
)

// bulk update with transformer
await updateInChunks('users', users, (user) => ({ ...user, processed: true }), {
  chunkSize: 500,
})
```

### Migrations

The package includes a custom migration runner that supports both SQL and
TypeScript migrations:

```typescript
import { migrate } from '@take-out/postgres/migrate'

await migrate({
  connectionString: process.env.DATABASE_URL,
  migrationsPath: './migrations',
  // optional: create additional databases (e.g., for Zero sync)
  createDatabases: ['myapp_cvr', 'myapp_change'],
})
```

## CLI

The package includes a CLI with several database utilities:

```bash
# show help
db --help

# connect to database with psql
db psql

# create a new migration
db migrate:add my-migration-name

# run migrations
db migrate

# dump database
db pg_dump > backup.sql

# sync drizzle migrations to TypeScript
db sync
```

### CLI Configuration

The CLI uses environment variables for configuration:

- `ZERO_UPSTREAM_DB`: Main database connection string
- `ZERO_CVR_DB`: CVR database for Zero sync (optional)
- `ZERO_CHANGE_DB`: Change database for Zero sync (optional)

## Migration System

### SQL Migrations (Drizzle Kit)

1. Update your schema files
2. Generate migration: `drizzle-kit generate`
3. Sync to TypeScript: `db sync`
4. Run migrations: `db migrate`

### TypeScript Migrations

For custom data migrations:

```bash
db migrate:add fix-user-data
```

This creates a new TypeScript file:

```typescript
import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // your migration code here
  await client.query(`
    UPDATE users SET email = lower(email)
  `)
}
```

### Migration Sync

The `db sync` command automatically wraps Drizzle-generated SQL migrations in
TypeScript:

```typescript
// migrations/0001_example.sql → migrations/0001_example.ts
import type { PoolClient } from 'pg'
import sql from './0001_example.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
```

## Connection Pooling

The package includes production-grade connection pooling with:

- **Retry Logic**: Exponential backoff with configurable attempts
- **Pool Monitoring**: Tracks connection saturation and automatically resets
- **Idle Timeout**: Configurable client and server idle timeouts
- **Error Handling**: Detects "too many connections" errors and manages pool
  lifecycle

## API

### Core Functions

#### `createPool(connectionString: string): Pool`

Creates a raw PostgreSQL connection pool.

#### `createDb(connectionString: string, schema: any): DrizzleDb`

Creates a Drizzle ORM instance with the provided schema.

#### `getDb(): DrizzleDb`

Singleton pattern for database instance (uses `ZERO_UPSTREAM_DB` env var).

### Helpers

#### `getDBClient(options?): Promise<PoolClient>`

Get a database client with retry logic and monitoring.

Options:

- `pool?: Pool` - Custom pool instance
- `retries?: number` - Retry attempts (default: 3)
- `onRetry?: (error: Error, attempt: number) => void` - Retry callback

#### `queryDb<T>(query: string, params?: any[]): Promise<T[]>`

Execute a query with automatic client management.

#### `processInChunks(query, processor, options?)`

Process large result sets in chunks to avoid memory issues.

#### `updateInChunks(table, rows, transformer, options?)`

Bulk update rows with a transformer function.

## Environment Variables

- `ZERO_UPSTREAM_DB`: PostgreSQL connection string (required)
- `ZERO_CVR_DB`: CVR database for Zero sync (optional)
- `ZERO_CHANGE_DB`: Change database for Zero sync (optional)
- `IS_SERVERLESS`: Set to 'true' for serverless environments (affects pool
  config)

## License

MIT
