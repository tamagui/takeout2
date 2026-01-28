---
name: takeout-triggers
description: PostgreSQL database triggers guide for automation and data consistency. creating triggers, trigger functions, plpgsql, BEFORE/AFTER triggers, INSERT/UPDATE/DELETE events, maintaining derived data, syncing tables, audit trails, cascading updates, counter maintenance, reaction counts, reply counts.
---

# Database Triggers Guide

## Overview

This guide documents the PostgreSQL triggers used in the start.chat application.
Triggers are database functions that automatically execute in response to
certain database events (INSERT, UPDATE, DELETE). They maintain data
consistency, update derived data, and sync information across tables without
requiring application-level code.

## Architecture

### Trigger Categories

The application uses triggers for four main purposes:

1. Search Indexing - Sync messages and data to search documents
2. Statistics Aggregation - Track message reactions and chat activity
3. Counter Maintenance - Keep thread reply counts accurate
4. Relationship Tracking - Monitor private chat interactions

### Naming Conventions

- Trigger Functions: `update_*()` or `sync_*_to_*()` format
- Triggers: `*Trigger` or `*_sync` suffix
- Stats Tables: `*Stats` suffix for aggregated data

## Core Triggers

### 1. Search Document Synchronization

Purpose: Automatically indexes messages and data for full-text and vector
search.

#### Message Search Sync

```sql
CREATE TRIGGER message_search_sync
AFTER INSERT OR UPDATE OR DELETE ON message
FOR EACH ROW
EXECUTE FUNCTION sync_message_to_search();
```

Function Logic:

- INSERT/UPDATE: Indexes non-draft, non-hidden messages with content
- DELETE: Removes message from search index
- Filters out messages with `type = 'draft'` or `type = 'hidden'`
- Only indexes messages where `deleted = false`
- Creates document ID as `msg_{message_id}`

Key Features:

- Extracts first 100 characters as title
- Maintains server and channel associations
- Sets reliability score (1-5 scale)
- Updates timestamps for freshness

#### Data Search Sync

```sql
CREATE TRIGGER data_search_sync
AFTER INSERT OR UPDATE OR DELETE ON data
FOR EACH ROW
EXECUTE FUNCTION sync_data_to_search();
```

Function Logic:

- Indexes all data entries with their key-value pairs
- Associates with app installations
- Preserves category and type metadata
- Creates document ID as `data_{data_id}`

### 2. Message Reaction Statistics

Purpose: Maintains aggregated reaction counts and user lists for efficient UI
rendering.

#### Reaction Stats Triggers

```sql
CREATE TRIGGER messageReactionInsertTrigger
AFTER INSERT ON messageReaction
FOR EACH ROW
EXECUTE FUNCTION updateMessageReactionStats();

CREATE TRIGGER messageReactionDeleteTrigger
AFTER DELETE ON messageReaction
FOR EACH ROW
EXECUTE FUNCTION updateMessageReactionStats();
```

Function Logic:

- INSERT: Recalculates stats for message/reaction combination
- DELETE: Updates or removes stats based on remaining reactions
- Aggregates total reaction count, first three users, reaction value and image
- Uses window functions for efficient ordering

Performance Optimizations:

- Deletes and re-inserts stats (faster than UPDATE)
- Limits user list to first 3 for UI
- Uses ROW_NUMBER() for deterministic ordering

### 3. Thread Reply Counters

Purpose: Maintains accurate reply counts for thread displays.

#### Reply Count Triggers

```sql
CREATE TRIGGER threadReplyCountInsertTrigger
AFTER INSERT ON message
FOR EACH ROW
WHEN (NEW.threadId IS NOT NULL)
EXECUTE FUNCTION updateThreadReplyCount();

CREATE TRIGGER threadReplyCountUpdateTrigger
AFTER UPDATE OF deleted ON message
FOR EACH ROW
WHEN (NEW.threadId IS NOT NULL OR OLD.threadId IS NOT NULL)
EXECUTE FUNCTION updateThreadReplyCount();

CREATE TRIGGER threadReplyCountDeleteTrigger
AFTER DELETE ON message
FOR EACH ROW
WHEN (OLD.threadId IS NOT NULL)
EXECUTE FUNCTION updateThreadReplyCount();
```

Function Logic:

- Counts non-deleted messages in thread
- Excludes the original thread message
- Caps count at 11 for "10+" display
- Handles soft deletes (deleted flag changes)
- Checks thread existence before updates (prevents cascade delete conflicts)
- Skips update when deleting thread's original message

Edge Cases Handled:

- Message moves between threads
- Soft delete/undelete operations
- Hard deletes
- Thread without replies
- Cascade deletes when original message is deleted

### 4. Private Chat Statistics

Purpose: Tracks interaction frequency between users in private chats.

#### Private Chat Stats Trigger

```sql
CREATE TRIGGER update_private_chats_stats_on_message_trigger
AFTER INSERT ON message
FOR EACH ROW
EXECUTE FUNCTION update_private_chats_stats_on_message();
```

Function Logic:

- Detects messages in private chat servers
- Updates stats for all parent servers where both users are members
- Tracks message counts (week/month/year), last message timestamp, interaction
  score
- Uses UPSERT pattern for efficiency

Score Calculation:

```sql
score = CASE
  WHEN messageCountWeek > 0
  THEN messageCountWeek * 10 + messageCountMonth
  ELSE messageCountMonth * 2 + messageCountYear
END
```

## Implementation Patterns

### 1. UPSERT Pattern

Most triggers use INSERT ... ON CONFLICT DO UPDATE for idempotency:

```sql
INSERT INTO stats_table (...)
VALUES (...)
ON CONFLICT (unique_key) DO UPDATE SET
  field = EXCLUDED.field,
  updated_at = NOW();
```

### 2. Conditional Execution

Triggers use WHEN clauses to avoid unnecessary function calls:

```sql
CREATE TRIGGER trigger_name
AFTER INSERT ON table
FOR EACH ROW
WHEN (NEW.field IS NOT NULL)
EXECUTE FUNCTION function_name();
```

### 3. Multi-Operation Handling

Functions check TG_OP to handle different operations:

```sql
IF TG_OP = 'INSERT' THEN
  -- insert logic
ELSIF TG_OP = 'UPDATE' THEN
  -- update logic
ELSIF TG_OP = 'DELETE' THEN
  -- delete logic
END IF;
```

### 4. Cascade Delete Safety

Prevent foreign key violations during cascade deletes:

```sql
IF TG_OP = 'DELETE' THEN
  SELECT EXISTS(SELECT 1 FROM parent_table WHERE id = OLD.parent_id) INTO parent_exists;

  IF NOT parent_exists THEN
    RETURN OLD;
  END IF;

  UPDATE parent_table SET counter = counter - 1 WHERE id = OLD.parent_id;
END IF;
```

### 5. Bulk Operations

Initial population uses batch inserts with conflict handling:

```sql
INSERT INTO search_documents (...)
SELECT ... FROM source_table
WHERE conditions
ON CONFLICT DO NOTHING;
```

## Performance Considerations

### Index Strategy

Each trigger-maintained table has appropriate indexes:

```sql
CREATE INDEX idx_search_vector USING GIN(search_vector);
CREATE INDEX idx_embedding USING ivfflat(embedding vector_cosine_ops);
CREATE INDEX idx_server_id ON search_documents(server_id);
```

### Optimization Techniques

1. Minimal Updates: Only update changed fields
2. Early Returns: Exit quickly for non-applicable rows
3. Batch Processing: Use CTEs for complex aggregations
4. Index Usage: Ensure queries use available indexes
5. Connection Pooling: Triggers reuse database connections

### Performance Monitoring

Monitor trigger performance with:

```sql
SELECT
  schemaname,
  tablename,
  calls,
  total_time,
  mean,
  max
FROM pg_stat_user_functions
WHERE schemaname = 'public';
```

## Migration Management

### Adding Triggers

1. Create function first
2. Create trigger
3. Backfill existing data
4. Test with sample operations

Example migration structure:

```typescript
export async function up(client: PoolClient) {
  await client.query(`CREATE OR REPLACE FUNCTION ...`)
  await client.query(`CREATE TRIGGER ...`)
  await client.query(`INSERT INTO ... SELECT ...`)
}
```

### Modifying Triggers

1. Drop existing trigger (not function)
2. Modify function with CREATE OR REPLACE
3. Recreate trigger
4. Test thoroughly

### Version Control

- Each trigger change gets a new migration file
- Include rollback logic in down() function
- Document breaking changes
- Test migrations on staging first

## Debugging Triggers

### Enable Trigger Debugging

```sql
SET log_statement = 'all';
SET log_min_messages = 'debug1';

SELECT * FROM pg_trigger WHERE tgname = 'trigger_name';
```

### Common Issues

1. Infinite Loops: Trigger updates same table

   - Solution: Use UPDATE ... WHERE to limit scope

2. Missing Data: Trigger conditions too restrictive

   - Solution: Review WHEN clauses and IF conditions

3. Performance Degradation: Complex calculations in trigger

   - Solution: Consider async processing or materialized views

4. Constraint Violations: Foreign key issues during deletes

   - Solution: Add proper CASCADE options or existence checks

5. Cascade Delete Conflicts: Trigger tries to update rows being deleted
   - Problem: When a parent record is deleted with CASCADE, triggers may attempt
     to update child records that are also being deleted
   - Solution: Check if related records still exist before updating them
   - Example: Thread reply count trigger checks if thread exists before updating
     when message is deleted

### Testing Triggers

```sql
BEGIN;
INSERT INTO table_name (...) VALUES (...);
SELECT * FROM affected_table WHERE ...;
ROLLBACK;

BEGIN;
UPDATE table_name SET field = value WHERE id = ...;
SELECT * FROM affected_table WHERE ...;
ROLLBACK;

BEGIN;
DELETE FROM table_name WHERE id = ...;
SELECT * FROM affected_table WHERE ...;
ROLLBACK;
```

## Best Practices

### 1. Trigger Design

- Keep trigger functions focused and simple
- Avoid complex business logic in triggers
- Use triggers for data integrity, not application logic
- Document trigger side effects

### 2. Error Handling

- Use proper exception handling in functions
- Log errors to application logs
- Provide meaningful error messages
- Consider failure recovery strategies

### 3. Maintenance

- Regular VACUUM and ANALYZE on trigger-maintained tables
- Monitor trigger execution times
- Review and optimize slow triggers
- Keep trigger documentation updated

### 4. Security

- Validate data within trigger functions
- Use proper permissions on trigger functions
- Avoid dynamic SQL in triggers
- Sanitize inputs when building queries

## Future Enhancements

### Planned Improvements

1. Async Processing: Move heavy computations to background jobs
2. Partitioning: Partition large stats tables by date
3. Caching: Add Redis caching for frequently accessed stats
4. Event Streaming: Publish trigger events to message queue

### Potential New Triggers

- User activity tracking
- Content moderation flags
- Audit logging
- Real-time notifications
- Cache invalidation

## Monitoring & Alerts

### Key Metrics

Monitor these metrics for trigger health:

1. Execution Time: Average and max trigger execution time
2. Error Rate: Failed trigger executions
3. Table Bloat: Size of trigger-maintained tables
4. Lock Contention: Waiting queries due to triggers
5. Index Usage: Ensure indexes are being used

### Alert Thresholds

- Trigger execution > 100ms
- Error rate > 1%
- Table bloat > 20%
- Lock wait time > 1s
- Index scan ratio < 90%

## Conclusion

Database triggers provide powerful automation for maintaining data consistency
and derived information. When used appropriately, they reduce application
complexity and ensure data integrity. However, they must be carefully designed,
thoroughly tested, and continuously monitored to prevent performance issues and
maintain system reliability.
