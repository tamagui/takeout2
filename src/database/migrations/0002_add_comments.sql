-- add commentCount to post
ALTER TABLE "post" ADD COLUMN "commentCount" integer NOT NULL DEFAULT 0;

-- create comment table
CREATE TABLE "comment" (
  "id" text PRIMARY KEY,
  "postId" text NOT NULL REFERENCES "post"("id") ON DELETE CASCADE,
  "userId" text NOT NULL REFERENCES "userPublic"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "comment_postId_idx" ON "comment"("postId");
CREATE INDEX "comment_userId_idx" ON "comment"("userId");

-- trigger function for commentCount
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
DECLARE
  target_post_id text;
  new_count integer;
BEGIN
  -- determine which post to update
  IF TG_OP = 'DELETE' THEN
    target_post_id := OLD."postId";
  ELSE
    target_post_id := NEW."postId";
  END IF;

  -- check post exists (cascade delete safety)
  IF NOT EXISTS (SELECT 1 FROM "post" WHERE "id" = target_post_id) THEN
    RETURN NULL;
  END IF;

  -- calculate new count
  SELECT COUNT(*) INTO new_count
  FROM "comment"
  WHERE "postId" = target_post_id;

  -- update post
  UPDATE "post"
  SET "commentCount" = new_count
  WHERE "id" = target_post_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- create trigger
CREATE TRIGGER post_comment_count_trigger
AFTER INSERT OR DELETE ON "comment"
FOR EACH ROW
EXECUTE FUNCTION update_post_comment_count();
