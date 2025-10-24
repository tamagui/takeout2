import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // First, ensure all private chat servers that should exist are created
  // This handles the case where private servers were created but stats weren't populated

  await client.query(`
    -- Insert stats for all existing private chat servers
    INSERT INTO "privateChatsStats" (
      "serverId",
      "userServerId", 
      "userAId",
      "userBId",
      score,
      "lastMessageAt",
      "messageCountWeek",
      "messageCountMonth", 
      "messageCountYear",
      "lastRefreshedAt"
    )
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
    ),
    -- Also create entries for private chats with no messages yet
    potential_private_chats AS (
      SELECT DISTINCT
        sm1."serverId" as parent_server_id,
        CONCAT(LEAST(sm1."userId", sm2."userId"), '___', GREATEST(sm1."userId", sm2."userId")) as user_server_id,
        LEAST(sm1."userId", sm2."userId") as user_a_id,
        GREATEST(sm1."userId", sm2."userId") as user_b_id
      FROM "serverMember" sm1
      INNER JOIN "serverMember" sm2 ON sm2."serverId" = sm1."serverId" AND sm2."userId" > sm1."userId"
      INNER JOIN server s1 ON s1.id = sm1."serverId"
      WHERE s1."isPrivateChat" = false
        AND EXISTS (
          SELECT 1 FROM server pcs 
          WHERE pcs.id = CONCAT(LEAST(sm1."userId", sm2."userId"), '___', GREATEST(sm1."userId", sm2."userId"))
            AND pcs."isPrivateChat" = true
        )
    )
    SELECT 
      parent_server_id as "serverId",
      user_server_id as "userServerId",
      user_a_id as "userAId",
      user_b_id as "userBId",
      COALESCE(
        CASE
          WHEN message_count_week > 0 THEN message_count_week * 10 + message_count_month
          ELSE message_count_month * 2 + message_count_year
        END,
        0
      )::integer as score,
      COALESCE(last_message_at, CURRENT_TIMESTAMP) as "lastMessageAt",
      COALESCE(message_count_week, 0)::integer as "messageCountWeek",
      COALESCE(message_count_month, 0)::integer as "messageCountMonth",
      COALESCE(message_count_year, 0)::integer as "messageCountYear",
      CURRENT_TIMESTAMP as "lastRefreshedAt"
    FROM private_chat_stats
    
    UNION ALL
    
    -- Include private chats with no messages
    SELECT 
      ppc.parent_server_id as "serverId",
      ppc.user_server_id as "userServerId",
      ppc.user_a_id as "userAId",
      ppc.user_b_id as "userBId",
      0 as score,
      CURRENT_TIMESTAMP as "lastMessageAt",
      0 as "messageCountWeek",
      0 as "messageCountMonth",
      0 as "messageCountYear",
      CURRENT_TIMESTAMP as "lastRefreshedAt"
    FROM potential_private_chats ppc
    WHERE NOT EXISTS (
      SELECT 1 FROM private_chat_stats pcs
      WHERE pcs.parent_server_id = ppc.parent_server_id
        AND pcs.user_server_id = ppc.user_server_id
    )
    
    ON CONFLICT ("serverId", "userServerId") DO UPDATE SET
      score = EXCLUDED.score,
      "lastMessageAt" = EXCLUDED."lastMessageAt",
      "messageCountWeek" = EXCLUDED."messageCountWeek",
      "messageCountMonth" = EXCLUDED."messageCountMonth",
      "messageCountYear" = EXCLUDED."messageCountYear",
      "lastRefreshedAt" = EXCLUDED."lastRefreshedAt";
  `)

  // Create or replace a function that can be called to refresh stats
  await client.query(`
    CREATE OR REPLACE FUNCTION populate_private_chats_stats_for_server(server_id varchar)
    RETURNS void AS $$
    BEGIN
      INSERT INTO "privateChatsStats" (
        "serverId",
        "userServerId", 
        "userAId",
        "userBId",
        score,
        "lastMessageAt",
        "messageCountWeek",
        "messageCountMonth", 
        "messageCountYear",
        "lastRefreshedAt"
      )
      SELECT 
        server_id,
        pcs.id,
        LEAST(pcs."userId", pcs."friendId"),
        GREATEST(pcs."userId", pcs."friendId"),
        0,
        CURRENT_TIMESTAMP,
        0,
        0,
        0,
        CURRENT_TIMESTAMP
      FROM server pcs
      INNER JOIN "serverMember" sm1 ON sm1."userId" = pcs."userId" AND sm1."serverId" = server_id
      INNER JOIN "serverMember" sm2 ON sm2."userId" = pcs."friendId" AND sm2."serverId" = server_id
      WHERE pcs."isPrivateChat" = true
        AND pcs."userId" IS NOT NULL
        AND pcs."friendId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "privateChatsStats" 
          WHERE "serverId" = server_id 
            AND "userServerId" = pcs.id
        );
    END;
    $$ LANGUAGE plpgsql;
  `)
}
