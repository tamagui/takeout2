import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // create function to update thread reply count
  await client.query(`
    CREATE OR REPLACE FUNCTION "updateThreadReplyCount"()
    RETURNS trigger AS $$
    DECLARE
      thread_count INTEGER;
    BEGIN
      -- for INSERT
      IF TG_OP = 'INSERT' THEN
        -- only count non-deleted messages that are thread replies (not the original message)
        SELECT COUNT(*)::INTEGER INTO thread_count
        FROM "message" 
        WHERE "threadId" = NEW."threadId" 
        AND "deleted" = false
        AND "id" != (SELECT "messageId" FROM "thread" WHERE "id" = NEW."threadId");
        
        -- cap at 11 for "10+" display
        IF thread_count > 11 THEN
          thread_count := 11;
        END IF;
        
        UPDATE "thread" 
        SET "replyCount" = thread_count
        WHERE "id" = NEW."threadId";
        
        RETURN NEW;
      END IF;
      
      -- for UPDATE (handle delete/undelete)
      IF TG_OP = 'UPDATE' THEN
        -- if deleted status changed
        IF OLD."deleted" != NEW."deleted" AND NEW."threadId" IS NOT NULL THEN
          SELECT COUNT(*)::INTEGER INTO thread_count
          FROM "message" 
          WHERE "threadId" = NEW."threadId" 
          AND "deleted" = false
          AND "id" != (SELECT "messageId" FROM "thread" WHERE "id" = NEW."threadId");
          
          -- cap at 11 for "10+" display
          IF thread_count > 11 THEN
            thread_count := 11;
          END IF;
          
          UPDATE "thread" 
          SET "replyCount" = thread_count
          WHERE "id" = NEW."threadId";
        END IF;
        
        RETURN NEW;
      END IF;
      
      -- for DELETE
      IF TG_OP = 'DELETE' THEN
        IF OLD."threadId" IS NOT NULL THEN
          SELECT COUNT(*)::INTEGER INTO thread_count
          FROM "message" 
          WHERE "threadId" = OLD."threadId" 
          AND "deleted" = false
          AND "id" != (SELECT "messageId" FROM "thread" WHERE "id" = OLD."threadId");
          
          -- cap at 11 for "10+" display
          IF thread_count > 11 THEN
            thread_count := 11;
          END IF;
          
          UPDATE "thread" 
          SET "replyCount" = thread_count
          WHERE "id" = OLD."threadId";
        END IF;
        
        RETURN OLD;
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // create triggers
  await client.query(`
    CREATE TRIGGER "threadReplyCountInsertTrigger"
    AFTER INSERT ON "message"
    FOR EACH ROW
    WHEN (NEW."threadId" IS NOT NULL)
    EXECUTE FUNCTION "updateThreadReplyCount"();
  `)

  await client.query(`
    CREATE TRIGGER "threadReplyCountUpdateTrigger"
    AFTER UPDATE OF "deleted" ON "message"
    FOR EACH ROW
    WHEN (NEW."threadId" IS NOT NULL OR OLD."threadId" IS NOT NULL)
    EXECUTE FUNCTION "updateThreadReplyCount"();
  `)

  await client.query(`
    CREATE TRIGGER "threadReplyCountDeleteTrigger"
    AFTER DELETE ON "message"
    FOR EACH ROW
    WHEN (OLD."threadId" IS NOT NULL)
    EXECUTE FUNCTION "updateThreadReplyCount"();
  `)

  // update all existing threads with their current reply counts
  await client.query(`
    UPDATE "thread" t
    SET "replyCount" = LEAST(
      (SELECT COUNT(*)::INTEGER
       FROM "message" m
       WHERE m."threadId" = t."id"
       AND m."deleted" = false
       AND m."id" != t."messageId"),
      11
    );
  `)
}
