import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // rename column from firstThreeUsers to allUsers
  await client.query(`
    ALTER TABLE "messageReactionStats" 
    RENAME COLUMN "firstThreeUsers" TO "allUsers";
  `)

  // update the refresh function to include all users
  await client.query(`
    CREATE OR REPLACE FUNCTION "refreshMessageReactionStats"()
    RETURNS void AS $$
    BEGIN
      -- use a transaction to ensure atomicity
      TRUNCATE TABLE "messageReactionStats";
      
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
          r.image as reaction_image
        FROM "messageReaction" mr
        INNER JOIN "reaction" r ON r.id = mr."reactionId"
        INNER JOIN "userPublic" u ON u.id = mr."creatorId"
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
          ) ORDER BY user_id ASC
        ) as "allUsers",
        EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint * 1000 as "lastRefreshedAt"
      FROM ranked_reactions
      GROUP BY "messageId", "reactionId", reaction_value, reaction_image;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // update the trigger function to include all users
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
        WITH all_reactions AS (
          SELECT 
            mr."messageId",
            mr."reactionId",
            mr."creatorId",
            u.id as user_id,
            u.username,
            u.name,
            r.value as reaction_value,
            r.image as reaction_image
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
            ) ORDER BY user_id ASC
          ) as "allUsers",
          EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint * 1000 as "lastRefreshedAt"
        FROM all_reactions
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
          WITH all_reactions AS (
            SELECT 
              mr."messageId",
              mr."reactionId",
              mr."creatorId",
              u.id as user_id,
              u.username,
              u.name,
              r.value as reaction_value,
              r.image as reaction_image
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
              ) ORDER BY user_id ASC
            ) as "allUsers",
            EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint * 1000 as "lastRefreshedAt"
          FROM all_reactions
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

  // refresh all stats with the new format
  await client.query(`SELECT "refreshMessageReactionStats"();`)
}
