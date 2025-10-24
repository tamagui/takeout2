-- Fix orphaned thread records that reference non-existent messages
-- This prevents foreign key constraint violations when adding the foreign key in migration 0021
UPDATE "thread" 
SET "messageId" = NULL 
WHERE "messageId" IS NOT NULL 
  AND "messageId" NOT IN (SELECT "id" FROM "message"); 
