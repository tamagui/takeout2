import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "privateChatsStats" (
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
  `)

  await client.query(`
    CREATE INDEX "idx_privateChatsStats_server" 
    ON "privateChatsStats" ("serverId", "score");
  `)

  await client.query(`
    CREATE INDEX "idx_privateChatsStats_userA" 
    ON "privateChatsStats" ("serverId", "userAId", "score");
  `)

  await client.query(`
    CREATE INDEX "idx_privateChatsStats_userB" 
    ON "privateChatsStats" ("serverId", "userBId", "score");
  `)

  await client.query(`
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
      INNER JOIN "serverMember" sm2 ON sm2."userId" = pcs."friendId" AND sm2."serverId" = sm1."serverId"
      LEFT JOIN channel c ON c."serverId" = pcs.id
      LEFT JOIN message m ON m."channelId" = c.id AND m.deleted = false
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
        WHEN message_count_week > 0 THEN message_count_week * 10 + message_count_month
        ELSE message_count_month * 2 + message_count_year
      END::integer as score,
      COALESCE(last_message_at, CURRENT_TIMESTAMP) as "lastMessageAt",
      message_count_week::integer as "messageCountWeek",
      message_count_month::integer as "messageCountMonth",
      message_count_year::integer as "messageCountYear",
      CURRENT_TIMESTAMP as "lastRefreshedAt"
    FROM private_chat_stats
    WHERE parent_server_id IS NOT NULL;
  `)

  await client.query(`
    CREATE OR REPLACE FUNCTION "refreshPrivateChatsStats"()
    RETURNS void AS $$
    BEGIN
      TRUNCATE TABLE "privateChatsStats";
      
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
        INNER JOIN "serverMember" sm2 ON sm2."userId" = pcs."friendId" AND sm2."serverId" = sm1."serverId"
        LEFT JOIN channel c ON c."serverId" = pcs.id
        LEFT JOIN message m ON m."channelId" = c.id AND m.deleted = false
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
          WHEN message_count_week > 0 THEN message_count_week * 10 + message_count_month
          ELSE message_count_month * 2 + message_count_year
        END::integer as score,
        COALESCE(last_message_at, CURRENT_TIMESTAMP) as "lastMessageAt",
        message_count_week::integer as "messageCountWeek",
        message_count_month::integer as "messageCountMonth",
        message_count_year::integer as "messageCountYear",
        CURRENT_TIMESTAMP as "lastRefreshedAt"
      FROM private_chat_stats
      WHERE parent_server_id IS NOT NULL;
    END;
    $$ LANGUAGE plpgsql;
  `)
}
