import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // Update the trigger function to be more efficient by directly referencing thread.messageId
  await client.query(`
    CREATE OR REPLACE FUNCTION "updateThreadReplyCount"()
    RETURNS trigger AS $$
    DECLARE
      thread_count INTEGER;
      thread_record RECORD;
    BEGIN
      -- Get the thread record once
      IF TG_OP = 'DELETE' THEN
        SELECT * INTO thread_record FROM "thread" WHERE "id" = OLD."threadId";
      ELSE
        SELECT * INTO thread_record FROM "thread" WHERE "id" = NEW."threadId";
      END IF;
      
      -- for INSERT
      IF TG_OP = 'INSERT' THEN
        -- only count non-deleted messages that are thread replies (not the original message)
        SELECT COUNT(*)::INTEGER INTO thread_count
        FROM "message" 
        WHERE "threadId" = NEW."threadId" 
        AND "deleted" = false
        AND "id" != thread_record."messageId";
        
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
          AND "id" != thread_record."messageId";
          
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
          AND "id" != thread_record."messageId";
          
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
}
