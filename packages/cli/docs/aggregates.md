---
name: aggregates
description: Database aggregates guide using PostgreSQL triggers and stats tables. INVOKE WHEN: commentCount, followerCount, likesCount, reactionCount, replyCount, derived columns, computed values, denormalized data, INSERT ON CONFLICT, UPSERT pattern, maintaining counts, syncing counts, aggregate tables, stats tables.
---

# Aggregates in your data

Zero doesn't support aggregates, but computing aggregates on read is slow for
any database. Queries like `SELECT COUNT(*)` seem innocent but become
problematic at scale—they lock rows, block writes, and get slower as data grows.
Denormalizing aggregates (storing pre-computed counts/sums) via triggers is a
well-established pattern used by most high-traffic applications.

We use Postgres triggers and stats tables to handle things like counting
replies or reactions. Note that we don't use materialized views since Zero
doesn't support them.

While these patterns seem complex, LLMs handle generating and maintaining them
well. In a future iteration we want to standardize how to define them and
automate migrations.

This guide explains how to implement efficient aggregate statistics using
PostgreSQL triggers, based on the privateChatsStats pattern used in this
codebase.

## Overview

Non-materialized aggregate triggers maintain summary statistics in real-time by:

1. Creating a dedicated stats table to store aggregated data
2. Using triggers to incrementally update stats when source data changes
3. Avoiding expensive full-table recalculations on every query

Use this approach when:

- You need real-time statistics that are always up-to-date
- The source data changes frequently but not massively
- You want to avoid the complexity and storage overhead of materialized views
- You need granular control over the aggregation logic

## Step 1: Design Your Stats Table

First, identify what statistics you need to track. Consider:

- Primary keys that uniquely identify each aggregate row
- Foreign keys to maintain referential integrity
- Aggregate columns (counts, sums, averages, etc.)
- Time-based aggregates (weekly, monthly, yearly counts)
- Metadata (lastUpdatedAt, score calculations, etc.)

### Example: privateChatsStats

```sql
CREATE TABLE "privateChatsStats" (
  "serverId" varchar NOT NULL REFERENCES "server"(id) ON DELETE CASCADE,
  "userServerId" varchar NOT NULL REFERENCES "server"(id) ON DELETE CASCADE,
  "userAId" varchar NOT NULL REFERENCES "userPublic"(id) ON DELETE CASCADE,
  "userBId" varchar NOT NULL REFERENCES "userPublic"(id) ON DELETE CASCADE,
  "score" integer NOT NULL DEFAULT 0,
  "lastMessageAt" timestamp NOT NULL,
  "messageCountWeek" integer NOT NULL DEFAULT 0,
  "messageCountMonth" integer NOT NULL DEFAULT 0,
  "messageCountYear" integer NOT NULL DEFAULT 0,
  "lastRefreshedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("serverId", "userServerId")
);

CREATE INDEX "idx_privateChatsStats_server"
  ON "privateChatsStats" ("serverId", "score");
CREATE INDEX "idx_privateChatsStats_userA"
  ON "privateChatsStats" ("serverId", "userAId", "score");
CREATE INDEX "idx_privateChatsStats_userB"
  ON "privateChatsStats" ("serverId", "userBId", "score");
```

## Step 2: Initial Population

Populate the stats table with existing data. This is a one-time operation that
calculates all historical statistics.

Key patterns:

- Use CTEs (WITH clauses) to structure complex queries
- Apply business logic for scoring/ranking
- Handle edge cases (NULL values, missing relationships)

```sql
INSERT INTO "privateChatsStats"
WITH private_chat_stats AS (
  SELECT DISTINCT
    sm1."serverId" as parent_server_id,
    pcs.id as user_server_id,
    LEAST(pcs."userId", pcs."friendId") as user_a_id,
    GREATEST(pcs."userId", pcs."friendId") as user_b_id,
    COUNT(DISTINCT m.id) as total_messages,
    MAX(m."createdAt") as last_message_at,
    COUNT(DISTINCT CASE
      WHEN m."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '7 days'
      THEN m.id
    END) as message_count_week,
    COUNT(DISTINCT CASE
      WHEN m."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days'
      THEN m.id
    END) as message_count_month,
    COUNT(DISTINCT CASE
      WHEN m."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '365 days'
      THEN m.id
    END) as message_count_year
  FROM server pcs
  INNER JOIN "serverMember" sm1 ON sm1."userId" = pcs."userId"
  INNER JOIN "serverMember" sm2 ON sm2."userId" = pcs."friendId"
    AND sm2."serverId" = sm1."serverId"
  LEFT JOIN channel c ON c."serverId" = pcs.id
  LEFT JOIN message m ON m."channelId" = c.id
    AND m.deleted = false
    AND m.type != 'draft'
  WHERE pcs."isPrivateChat" = true
    AND pcs."userId" IS NOT NULL
    AND pcs."friendId" IS NOT NULL
    AND sm1."serverId" != pcs.id
  GROUP BY sm1."serverId", pcs.id, pcs."userId", pcs."friendId"
)
SELECT
  parent_server_id as "serverId",
  user_server_id as "userServerId",
  user_a_id as "userAId",
  user_b_id as "userBId",
  CASE
    WHEN message_count_week > 0
    THEN message_count_week * 10 + message_count_month
    ELSE message_count_month * 2 + message_count_year
  END::integer as score,
  COALESCE(last_message_at, CURRENT_TIMESTAMP) as "lastMessageAt",
  message_count_week::integer as "messageCountWeek",
  message_count_month::integer as "messageCountMonth",
  message_count_year::integer as "messageCountYear",
  CURRENT_TIMESTAMP as "lastRefreshedAt"
FROM private_chat_stats
WHERE parent_server_id IS NOT NULL;
```

## Step 3: Create the Trigger Function

The trigger function contains the logic for incrementally updating statistics.

Critical considerations:

1. Performance: Minimize database operations
2. Correctness: Handle all edge cases
3. Idempotency: Updates should be consistent regardless of order
4. Atomicity: Use proper transaction handling

```sql
CREATE OR REPLACE FUNCTION update_private_chats_stats_on_message()
RETURNS TRIGGER AS $$
DECLARE
  private_server RECORD;
  parent_server_id varchar;
  new_week_count integer;
  new_month_count integer;
  new_year_count integer;
BEGIN
  IF NEW.type = 'draft' OR NEW.deleted = true THEN
    RETURN NEW;
  END IF;

  SELECT s.* INTO private_server
  FROM server s
  INNER JOIN channel c ON c."serverId" = s.id
  WHERE c.id = NEW."channelId"
    AND s."isPrivateChat" = true
    AND s."userId" IS NOT NULL
    AND s."friendId" IS NOT NULL;

  IF private_server IS NULL THEN
    RETURN NEW;
  END IF;

  FOR parent_server_id IN
    SELECT DISTINCT sm1."serverId"
    FROM "serverMember" sm1
    INNER JOIN "serverMember" sm2 ON sm2."serverId" = sm1."serverId"
    WHERE sm1."userId" = private_server."userId"
      AND sm2."userId" = private_server."friendId"
      AND sm1."serverId" != private_server.id
  LOOP
    SELECT
      COALESCE("messageCountWeek", 0) + CASE
        WHEN NEW."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1
        ELSE 0
      END,
      COALESCE("messageCountMonth", 0) + CASE
        WHEN NEW."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1
        ELSE 0
      END,
      COALESCE("messageCountYear", 0) + CASE
        WHEN NEW."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '365 days' THEN 1
        ELSE 0
      END
    INTO new_week_count, new_month_count, new_year_count
    FROM "privateChatsStats"
    WHERE "serverId" = parent_server_id
      AND "userServerId" = private_server.id;

    IF new_week_count IS NULL THEN
      new_week_count := CASE
        WHEN NEW."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '7 days'
        THEN 1 ELSE 0 END;
      new_month_count := CASE
        WHEN NEW."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days'
        THEN 1 ELSE 0 END;
      new_year_count := CASE
        WHEN NEW."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '365 days'
        THEN 1 ELSE 0 END;
    END IF;

    INSERT INTO "privateChatsStats" (
      "serverId", "userServerId", "userAId", "userBId",
      score, "lastMessageAt", "messageCountWeek",
      "messageCountMonth", "messageCountYear", "lastRefreshedAt"
    )
    VALUES (
      parent_server_id,
      private_server.id,
      LEAST(private_server."userId", private_server."friendId"),
      GREATEST(private_server."userId", private_server."friendId"),
      CASE
        WHEN new_week_count > 0
        THEN new_week_count * 10 + new_month_count
        ELSE new_month_count * 2 + new_year_count
      END,
      NEW."createdAt",
      new_week_count,
      new_month_count,
      new_year_count,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("serverId", "userServerId") DO UPDATE SET
      "lastMessageAt" = GREATEST("privateChatsStats"."lastMessageAt", NEW."createdAt"),
      "messageCountWeek" = new_week_count,
      "messageCountMonth" = new_month_count,
      "messageCountYear" = new_year_count,
      score = CASE
        WHEN new_week_count > 0
        THEN new_week_count * 10 + new_month_count
        ELSE new_month_count * 2 + new_year_count
      END,
      "lastRefreshedAt" = CURRENT_TIMESTAMP;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Step 4: Create the Trigger

```sql
CREATE TRIGGER update_private_chats_stats_on_message_trigger
AFTER INSERT ON message
FOR EACH ROW
EXECUTE FUNCTION update_private_chats_stats_on_message();
```

## Step 5: Maintenance Functions

Create utility functions for maintenance tasks:

- Full refresh when data gets out of sync
- Cleanup of stale statistics
- Periodic recalculation of time-based aggregates

### Full Refresh Function

```sql
CREATE OR REPLACE FUNCTION "refreshPrivateChatsStats"()
RETURNS void AS $$
BEGIN
  TRUNCATE TABLE "privateChatsStats";
  INSERT INTO "privateChatsStats"
  WITH private_chat_stats AS (
    -- same CTE as initial population
  )
  SELECT
    -- same selection as initial population
  FROM private_chat_stats
  WHERE parent_server_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
```

### Periodic Update Function

```sql
CREATE OR REPLACE FUNCTION "updateTimeBasedAggregates"()
RETURNS void AS $$
BEGIN
  UPDATE "privateChatsStats" pcs
  SET
    "messageCountWeek" = (
      SELECT COUNT(*)
      FROM message m
      INNER JOIN channel c ON c.id = m."channelId"
      WHERE c."serverId" = pcs."userServerId"
        AND m.type != 'draft'
        AND m.deleted = false
        AND m."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '7 days'
    ),
    "messageCountMonth" = (
      SELECT COUNT(*)
      FROM message m
      INNER JOIN channel c ON c.id = m."channelId"
      WHERE c."serverId" = pcs."userServerId"
        AND m.type != 'draft'
        AND m.deleted = false
        AND m."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days'
    ),
    "messageCountYear" = (
      SELECT COUNT(*)
      FROM message m
      INNER JOIN channel c ON c.id = m."channelId"
      WHERE c."serverId" = pcs."userServerId"
        AND m.type != 'draft'
        AND m.deleted = false
        AND m."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '365 days'
    ),
    score = CASE
      WHEN "messageCountWeek" > 0
      THEN "messageCountWeek" * 10 + "messageCountMonth"
      ELSE "messageCountMonth" * 2 + "messageCountYear"
    END,
    "lastRefreshedAt" = CURRENT_TIMESTAMP
  WHERE "lastRefreshedAt" < CURRENT_TIMESTAMP - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;
```

## LLM Prompting Guide

When asking an LLM to implement aggregate triggers, use this template:

```markdown
I need to implement a non-materialized aggregate trigger system in PostgreSQL.

Context:

- Source table: [describe your source table and its purpose]
- Aggregation needs: [what statistics do you need to track]
- Update frequency: [how often does source data change]
- Query patterns: [how will the aggregated data be queried]

Requirements:

1. Create a stats table that stores aggregated data efficiently
2. Implement triggers that incrementally update statistics when source data
   changes
3. Avoid full table scans on every update - use incremental calculations
4. Handle edge cases: NULL values, deletions, updates to existing records
5. Include proper indexes for query performance
6. Provide a full refresh function for maintenance

Specific statistics needed:

- [List each aggregate: counts, sums, averages, time-based aggregates]
- [Scoring/ranking algorithms if applicable]
- [Relationships between entities]

Performance constraints:

- Trigger execution should be < [X]ms
- Stats queries should return in < [Y]ms
- Support [Z] concurrent updates

Please provide:

1. CREATE TABLE statement for the stats table with appropriate indexes
2. Initial population query using CTEs
3. Trigger function with incremental update logic
4. CREATE TRIGGER statement
5. Maintenance functions (full refresh, cleanup)
6. Migration script structure (up/down functions)

Follow these patterns:

- Use LEAST/GREATEST for consistent ordering of paired values
- Use ON CONFLICT ... DO UPDATE for upserts
- Calculate time-based aggregates using CASE statements
- Return NEW from trigger functions for AFTER triggers
- Include proper error handling and NULL checks
```

## Best Practices

### Performance

- Use early exits in trigger functions to skip irrelevant records
- Batch updates when possible using `INSERT ... ON CONFLICT`
- Create indexes on foreign keys and commonly queried columns
- Consider partitioning stats tables for very large datasets
- Use `EXPLAIN ANALYZE` to optimize trigger performance

### Correctness

- Always normalize data order (e.g., `LEAST/GREATEST` for user pairs)
- Handle NULL values explicitly in all calculations
- Use transactions for complex multi-step updates
- Test edge cases: first record, deletions, updates
- Implement idempotent operations where possible

### Maintenance

- Create a full refresh function for recovering from corruption
- Implement periodic cleanup for time-based aggregates
- Monitor trigger execution time and table bloat
- Document the scoring/ranking algorithms clearly
- Version your trigger functions with migration scripts

### Testing

- Write integration tests that verify trigger behavior
- Test concurrent updates to ensure data consistency
- Verify that stats remain accurate after bulk operations
- Test the full refresh function against production-like data
- Benchmark trigger performance under load

## Troubleshooting

### Stats are out of sync

- Diagnosis: Run a query comparing aggregated stats with actual counts
- Solution: Execute the full refresh function, investigate trigger failures
- Prevention: Add monitoring queries, implement periodic validation

### Trigger is too slow

- Diagnosis: Use `EXPLAIN ANALYZE` on the trigger function queries
- Solution: Add missing indexes, simplify calculations, consider async
  processing
- Prevention: Profile trigger performance before production deployment

### Time-based aggregates are incorrect

- Diagnosis: Check timezone handling, verify INTERVAL calculations
- Solution: Run the updateTimeBasedAggregates function, fix timezone issues
- Prevention: Use consistent timezone handling (preferably UTC)

### Deadlocks during concurrent updates

- Diagnosis: Check `pg_stat_activity` and `deadlock_timeout` settings
- Solution: Reorder operations to acquire locks consistently
- Prevention: Use advisory locks or queue-based processing for high contention

### Stats table is growing too large

- Diagnosis: Check for orphaned records, analyze table bloat
- Solution: Implement cleanup for deleted entities, `VACUUM` regularly
- Prevention: Add `ON DELETE CASCADE`, implement retention policies

## Migration Structure

```typescript
import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  await client.query(`...`) // 1. create the stats table
  await client.query(`...`) // 2. create indexes
  await client.query(`...`) // 3. populate initial data
  await client.query(`...`) // 4. create trigger function
  await client.query(`...`) // 5. create trigger
  await client.query(`...`) // 6. create maintenance functions
}
```

## Advanced Patterns

### Multi-Table Aggregates

```sql
-- aggregate data from multiple related tables
-- use JOINs carefully to avoid cartesian products
-- consider using LATERAL joins for correlated subqueries
```

### Conditional Aggregates

```sql
-- use FILTER clauses in PostgreSQL 9.4+
COUNT(*) FILTER (WHERE condition) as conditional_count

-- or use CASE statements for older versions
COUNT(CASE WHEN condition THEN 1 END) as conditional_count
```

### Window Functions

```sql
-- use window functions for ranking within groups
ROW_NUMBER() OVER (PARTITION BY group_col ORDER BY score DESC) as rank

-- calculate running totals
SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
```

### Recursive Aggregates

```sql
-- use recursive CTEs for hierarchical data
WITH RECURSIVE hierarchy AS (
  SELECT id, parent_id, value FROM nodes WHERE parent_id IS NULL
  UNION ALL
  SELECT n.id, n.parent_id, n.value + h.value
  FROM nodes n
  INNER JOIN hierarchy h ON n.parent_id = h.id
)
SELECT * FROM hierarchy;
```

## Complete Example: Channel User Statistics

Here's a simplified example showing all pieces working together:

### Stats Table

```sql
CREATE TABLE channel_user_stats (
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMP,
  first_message_at TIMESTAMP,
  PRIMARY KEY (channel_id, user_id)
);

CREATE INDEX idx_channel_user_stats_user
  ON channel_user_stats(user_id, message_count DESC);
```

### Trigger Function

```sql
CREATE OR REPLACE FUNCTION update_channel_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO channel_user_stats (
      channel_id, user_id, message_count,
      last_message_at, first_message_at
    )
    VALUES (
      NEW.channel_id, NEW.user_id, 1,
      NEW.created_at, NEW.created_at
    )
    ON CONFLICT (channel_id, user_id) DO UPDATE SET
      message_count = channel_user_stats.message_count + 1,
      last_message_at = NEW.created_at,
      first_message_at = COALESCE(
        channel_user_stats.first_message_at,
        NEW.created_at
      );
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE channel_user_stats
    SET message_count = GREATEST(0, message_count - 1)
    WHERE channel_id = OLD.channel_id AND user_id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### Trigger

```sql
CREATE TRIGGER trigger_update_channel_user_stats
AFTER INSERT OR DELETE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_channel_user_stats();
```

## Conclusion

Non-materialized aggregate triggers provide a powerful pattern for maintaining
real-time statistics in PostgreSQL. By following this guide and the
privateChatsStats implementation pattern, you can build efficient, maintainable
aggregate systems that scale with your application's needs.
