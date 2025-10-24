import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // create regular table structure first
  await client.query(`
    CREATE TABLE IF NOT EXISTS "messageReactionStats" (
      "messageId" varchar NOT NULL,
      "reactionId" varchar NOT NULL,
      "reactionValue" varchar NOT NULL,
      "reactionImage" varchar,
      "reactionCount" integer NOT NULL,
      "firstThreeUsers" jsonb NOT NULL,
      "lastRefreshedAt" bigint NOT NULL,
      PRIMARY KEY ("messageId", "reactionId")
    );
  `)

  // populate the table with initial data
  await client.query(`
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
  `)

  // create additional indexes for better query performance
  await client.query(`
    CREATE INDEX "idxMessageReactionStatsMessage" 
    ON "messageReactionStats" ("messageId");
  `)

  await client.query(`
    CREATE INDEX "idxMessageReactionStatsReaction" 
    ON "messageReactionStats" ("reactionId");
  `)

  // create function to refresh the table (truncate and repopulate)
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
          r.image as reaction_image,
          ROW_NUMBER() OVER (
            PARTITION BY mr."messageId", mr."reactionId" 
            ORDER BY mr."createdAt" ASC
          ) as rn
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
          ) ORDER BY rn ASC
        ) FILTER (WHERE rn <= 3) as "firstThreeUsers",
        EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint * 1000 as "lastRefreshedAt"
      FROM ranked_reactions
      GROUP BY "messageId", "reactionId", reaction_value, reaction_image;
    END;
    $$ LANGUAGE plpgsql;
  `)
}
