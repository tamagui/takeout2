---
name: takeout-aggregates
description: Database aggregates via PostgreSQL triggers. commentCount, followerCount, reactionCount, stats tables, INSERT ON CONFLICT, denormalized counts.
---

# Aggregates

Zero doesn't support aggregates, and `SELECT COUNT(*)` is slow at scale. Use
Postgres triggers to maintain pre-computed counts in stats tables.

## when to use

- need real-time counts (comments, followers, reactions)
- source data changes frequently
- queries need to be fast

**alternative:** for filtering (not displaying counts), use Zero's `exists()`
in permissions instead of maintaining a stats table. see zero.md.

## pattern

1. stats table with count columns
2. trigger on INSERT/DELETE to increment/decrement
3. query the stats table instead of COUNT(*)

## simple example: post comment count

### stats column on post

```sql
-- add column to existing table
ALTER TABLE post ADD COLUMN "commentCount" INTEGER NOT NULL DEFAULT 0;
```

### trigger function

```sql
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post SET "commentCount" = "commentCount" + 1
    WHERE id = NEW."postId";
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post SET "commentCount" = GREATEST(0, "commentCount" - 1)
    WHERE id = OLD."postId";
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### trigger

```sql
CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON comment
FOR EACH ROW
EXECUTE FUNCTION update_post_comment_count();
```

### backfill existing data

```sql
UPDATE post p SET "commentCount" = (
  SELECT COUNT(*) FROM comment c WHERE c."postId" = p.id
);
```

## separate stats table

for complex aggregates (multiple counts, time-based stats), use a dedicated table:

```sql
CREATE TABLE "userStats" (
  "userId" VARCHAR PRIMARY KEY REFERENCES "userPublic"(id) ON DELETE CASCADE,
  "postCount" INTEGER NOT NULL DEFAULT 0,
  "followerCount" INTEGER NOT NULL DEFAULT 0,
  "followingCount" INTEGER NOT NULL DEFAULT 0
);
```

use `INSERT ... ON CONFLICT` for upserts:

```sql
INSERT INTO "userStats" ("userId", "postCount")
VALUES (NEW."userId", 1)
ON CONFLICT ("userId") DO UPDATE SET
  "postCount" = "userStats"."postCount" + 1;
```

## tips

- use `GREATEST(0, count - 1)` to prevent negative counts
- add `ON DELETE CASCADE` to stats table foreign keys
- create a refresh function for recovering from drift:

```sql
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void AS $$
BEGIN
  UPDATE "userStats" us SET
    "postCount" = (SELECT COUNT(*) FROM post WHERE "userId" = us."userId"),
    "followerCount" = (SELECT COUNT(*) FROM follow WHERE "followedId" = us."userId");
END;
$$ LANGUAGE plpgsql;
```

## vs exists() in Zero

| use case | solution |
|----------|----------|
| display count in UI | stats table + trigger |
| filter "has any" | `exists()` in permission |
| filter "blocked by" | `exists()` in permission |

`exists()` is simpler when you just need to filter, not display a number.

## migration structure

```typescript
export async function up(client: PoolClient) {
  await client.query(`ALTER TABLE post ADD COLUMN "commentCount" INTEGER DEFAULT 0`)
  await client.query(`CREATE OR REPLACE FUNCTION ...`)
  await client.query(`CREATE TRIGGER ...`)
  await client.query(`UPDATE post SET "commentCount" = ...`)  // backfill
}
```

## llm prompting

when asking an LLM to implement triggers:

```
implement a postgres trigger to maintain [count type] on [target table].

source table: [table] with columns [relevant cols]
target: [where to store count]
events: INSERT/DELETE on [source]

provide: trigger function, CREATE TRIGGER, backfill query
```
