---
name: takeout-zero-setup
description: "Zero setup, configuration, and debugging guide. environment variables, ZERO_NUM_SYNC_WORKERS, ZERO_CVR_MAX_CONNS, ZERO_UPSTREAM_MAX_CONNS, rate limiting, database connection limits, production tuning, relationships config, type generation, bun tko zero generate, ?debug=2, performance troubleshooting, analyze-indexes, slow queries, indexes, SQLite replica."
---

## relationships

define in `src/data/relationships.ts`:

```ts
export const postRelationships = relationships(tables.post, ({ one, many }) => ({
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  comments: many({
    sourceField: ['id'],
    destSchema: tables.comment,
    destField: ['postId'],
  }),
}))
```

relationships are required for `.related()` in queries and `exists()` in
permissions. see `takeout-zero-queries` for usage.

## type generation

regenerate after schema changes:

```bash
bun tko zero generate
```

`bun dev` watches and regenerates automatically.

## debugging

add `?debug=2` to url for detailed zero logs.

### performance troubleshooting

Zero logs warnings when queries are slow on the client-side SQLite replica:

- **"table-source.next took too long... Are you missing an index?"** — a single row
  fetch took >2ms (threshold: `slowRowThreshold`). usually means a full table scan.
- **slow hydrate warning** — query materialization took >100ms (`slowHydrateThreshold`).
- **slow materialize warning** — client-side query took >5s (`slowMaterializeThreshold`).

these are sampled (1 in 5000 requests), so seeing even one means it's happening often.

**how Zero handles indexes:** Zero replicates ALL postgres indexes to the client SQLite
replica automatically, as long as they're not expression-based or partial indexes, and the
columns are in the publication. if your postgres has the right indexes, SQLite will too.

### analyze-indexes script

```bash
bun ./scripts/zero/analyze-indexes.ts
```

this script:
- lists all postgres indexes and which ones Zero replicates to SQLite
- diffs postgres vs SQLite replica indexes to find gaps
- shows table stats (row counts, dead rows, bloat)
- identifies sequential scan hotspots (tables doing full scans)
- runs EXPLAIN ANALYZE on actual app query patterns
- recommends missing composite indexes based on query shapes

common fixes:
- add composite indexes for multi-column WHERE + ORDER BY patterns
- add indexes on relationship foreign keys (e.g. `actorId` for `related('actor')`)
- add indexes on columns used in `serverWhere` / `exists()` filters

### index tips for Zero queries

Zero translates ZQL queries to SQL on both postgres (server) and SQLite (client).
indexes matter on both sides:

```ts
// needs index on (userId) AND (createdAt) — ideally composite (userId, createdAt)
zql.post.where('userId', id).orderBy('createdAt', 'desc').limit(20)

// needs composite (userId, read)
zql.notification.where('userId', id).where('read', false)

// exists() subqueries need indexes on the filtered column
q.not(q.exists('authorBlockedBy', (b) => b.where('blockerId', auth.id)))
// needs index on block(blockerId)
```

## production tuning

### environment variables

add to `.env.production`:

```bash
# Zero performance tuning
ZERO_NUM_SYNC_WORKERS=6        # up to 1 per CPU core
ZERO_CVR_MAX_CONNS=12          # CVR db connections
ZERO_UPSTREAM_MAX_CONNS=24     # main db connections

# rate limiting (mutations per user per window)
ZERO_PER_USER_MUTATION_LIMIT_MAX=50
ZERO_PER_USER_MUTATION_LIMIT_WINDOW_MS=60000
```

### database connection limits

total Zero connections = `UPSTREAM_MAX_CONNS + CVR_MAX_CONNS + ~10 buffer`

- Supabase Free: 60 max → keep total under 40
- Supabase Pro: 100 max → can go to 60
- Dedicated Postgres: check `max_connections` setting

### deploying changes

after updating `.env.production`, sync and deploy without rebuilding:

```bash
# sync new env vars to GitHub secrets
bun scripts/env/sync-to-github.ts

# deploy config-only changes (no build)
bun tko uncloud deploy-prod --skip-build --skip-docker
```

### monitoring

```bash
ssh root@YOUR_SERVER_IP "docker stats --no-stream"
```

Zero memory usage should increase with more workers (~50-100MB per worker).

## related skills

- `takeout-zero` — overview, anti-patterns, when to use each sub-skill
- `takeout-zero-queries` — useQuery, zql, serverWhere, pagination
- `takeout-zero-models` — mutations, CRUD, permissions, convergence
- `takeout-database` — PostgreSQL, Drizzle ORM, migrations
