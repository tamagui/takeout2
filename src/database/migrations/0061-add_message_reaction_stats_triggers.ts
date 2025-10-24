import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // drop existing placeholder triggers if they exist
  await client.query(
    `DROP TRIGGER IF EXISTS "messageReactionInsertTrigger" ON "messageReaction";`
  )
  await client.query(
    `DROP TRIGGER IF EXISTS "messageReactionDeleteTrigger" ON "messageReaction";`
  )
  await client.query(`DROP FUNCTION IF EXISTS "notifyReactionChange"();`)

  // create function to update stats for a specific message/reaction
  await client.query(`
    CREATE OR REPLACE FUNCTION "updateMessageReactionStats"()
    RETURNS trigger AS $$
    BEGIN
      -- for INSERT
      IF TG_OP = 'INSERT' THEN
        -- delete existing stat for this message/reaction combo
        DELETE FROM "messageReactionStats" 
        WHERE "messageId" = NEW."messageId" 
        AND "reactionId" = NEW."reactionId";
        
        -- insert updated stats
        INSERT INTO "messageReactionStats"
        WITH ranked_reactions AS (
          SELECT 
            mr."messageId",
            mr."reactionId",
            mr."creatorId",
            u.id as user_id,
            u.username,
            u.name,
            r.value as reaction_value,
            r.image as reaction_image,
            ROW_NUMBER() OVER (
              PARTITION BY mr."messageId", mr."reactionId" 
              ORDER BY mr."createdAt" ASC
            ) as rn
          FROM "messageReaction" mr
          INNER JOIN "reaction" r ON r.id = mr."reactionId"
          INNER JOIN "userPublic" u ON u.id = mr."creatorId"
          WHERE mr."messageId" = NEW."messageId" 
          AND mr."reactionId" = NEW."reactionId"
        )
        SELECT 
          "messageId",
          "reactionId",
          reaction_value as "reactionValue",
          reaction_image as "reactionImage",
          COUNT(*)::integer as "reactionCount",
          jsonb_agg(
            jsonb_build_object(
              'userId', user_id,
              'username', username,
              'name', name
            ) ORDER BY rn ASC
          ) FILTER (WHERE rn <= 3) as "firstThreeUsers",
          EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint * 1000 as "lastRefreshedAt"
        FROM ranked_reactions
        GROUP BY "messageId", "reactionId", reaction_value, reaction_image;
        
        RETURN NEW;
      END IF;
      
      -- for DELETE
      IF TG_OP = 'DELETE' THEN
        -- check if there are any reactions left for this message/reaction combo
        IF EXISTS (
          SELECT 1 FROM "messageReaction" 
          WHERE "messageId" = OLD."messageId" 
          AND "reactionId" = OLD."reactionId"
        ) THEN
          -- update the stats
          DELETE FROM "messageReactionStats" 
          WHERE "messageId" = OLD."messageId" 
          AND "reactionId" = OLD."reactionId";
          
          INSERT INTO "messageReactionStats"
          WITH ranked_reactions AS (
            SELECT 
              mr."messageId",
              mr."reactionId",
              mr."creatorId",
              u.id as user_id,
              u.username,
              u.name,
              r.value as reaction_value,
              r.image as reaction_image,
              ROW_NUMBER() OVER (
                PARTITION BY mr."messageId", mr."reactionId" 
                ORDER BY mr."createdAt" ASC
              ) as rn
            FROM "messageReaction" mr
            INNER JOIN "reaction" r ON r.id = mr."reactionId"
            INNER JOIN "userPublic" u ON u.id = mr."creatorId"
            WHERE mr."messageId" = OLD."messageId" 
            AND mr."reactionId" = OLD."reactionId"
          )
          SELECT 
            "messageId",
            "reactionId",
            reaction_value as "reactionValue",
            reaction_image as "reactionImage",
            COUNT(*)::integer as "reactionCount",
            jsonb_agg(
              jsonb_build_object(
                'userId', user_id,
                'username', username,
                'name', name
              ) ORDER BY rn ASC
            ) FILTER (WHERE rn <= 3) as "firstThreeUsers",
            EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint * 1000 as "lastRefreshedAt"
          FROM ranked_reactions
          GROUP BY "messageId", "reactionId", reaction_value, reaction_image;
        ELSE
          -- no reactions left, delete the stat row
          DELETE FROM "messageReactionStats" 
          WHERE "messageId" = OLD."messageId" 
          AND "reactionId" = OLD."reactionId";
        END IF;
        
        RETURN OLD;
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // create triggers
  await client.query(`
    CREATE TRIGGER "messageReactionInsertTrigger"
    AFTER INSERT ON "messageReaction"
    FOR EACH ROW
    EXECUTE FUNCTION "updateMessageReactionStats"();
  `)

  await client.query(`
    CREATE TRIGGER "messageReactionDeleteTrigger"
    AFTER DELETE ON "messageReaction"
    FOR EACH ROW
    EXECUTE FUNCTION "updateMessageReactionStats"();
  `)

  // refresh all existing stats
  await client.query(`SELECT "refreshMessageReactionStats"();`)
}
