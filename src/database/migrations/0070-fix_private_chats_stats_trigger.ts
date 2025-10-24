import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // update the trigger function to only count non-draft messages
  await client.query(`
    CREATE OR REPLACE FUNCTION update_private_chats_stats_on_message()
    RETURNS TRIGGER AS $$
    DECLARE
      private_server RECORD;
      parent_server_id varchar;
    BEGIN
      -- only process non-draft messages
      IF NEW.type = 'draft' OR NEW.deleted = true THEN
        RETURN NEW;
      END IF;
      
      -- check if this message is in a private chat
      SELECT s.* INTO private_server
      FROM server s
      INNER JOIN channel c ON c."serverId" = s.id
      WHERE c.id = NEW."channelId"
        AND s."isPrivateChat" = true
        AND s."userId" IS NOT NULL
        AND s."friendId" IS NOT NULL;
      
      IF private_server IS NULL THEN
        RETURN NEW;
      END IF;
      
      -- for each parent server where both users are members
      FOR parent_server_id IN
        SELECT DISTINCT sm1."serverId"
        FROM "serverMember" sm1
        INNER JOIN "serverMember" sm2 ON sm2."serverId" = sm1."serverId"
        WHERE sm1."userId" = private_server."userId"
          AND sm2."userId" = private_server."friendId"
          AND sm1."serverId" != private_server.id
      LOOP
        -- insert or update the stats
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
        VALUES (
          parent_server_id,
          private_server.id,
          LEAST(private_server."userId", private_server."friendId"),
          GREATEST(private_server."userId", private_server."friendId"),
          1,
          NEW."createdAt",
          1,
          1,
          1,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT ("serverId", "userServerId") DO UPDATE SET
          "lastMessageAt" = GREATEST("privateChatsStats"."lastMessageAt", NEW."createdAt"),
          "messageCountWeek" = CASE 
            WHEN NEW."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '7 days'
            THEN "privateChatsStats"."messageCountWeek" + 1
            ELSE "privateChatsStats"."messageCountWeek"
          END,
          "messageCountMonth" = CASE
            WHEN NEW."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days'
            THEN "privateChatsStats"."messageCountMonth" + 1
            ELSE "privateChatsStats"."messageCountMonth"
          END,
          "messageCountYear" = CASE
            WHEN NEW."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '365 days'
            THEN "privateChatsStats"."messageCountYear" + 1
            ELSE "privateChatsStats"."messageCountYear"
          END,
          score = CASE
            WHEN "privateChatsStats"."messageCountWeek" > 0 
            THEN "privateChatsStats"."messageCountWeek" * 10 + "privateChatsStats"."messageCountMonth"
            ELSE "privateChatsStats"."messageCountMonth" * 2 + "privateChatsStats"."messageCountYear"
          END,
          "lastRefreshedAt" = CURRENT_TIMESTAMP;
      END LOOP;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // also run a one-time update to fix existing stats
  await client.query(`
    UPDATE "privateChatsStats" pcs
    SET 
      "messageCountWeek" = (
        SELECT COUNT(*)
        FROM message m
        INNER JOIN channel c ON c.id = m."channelId"
        WHERE c."serverId" = pcs."userServerId"
          AND m.type != 'draft'
          AND m.deleted = false
          AND m."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '7 days'
      ),
      "messageCountMonth" = (
        SELECT COUNT(*)
        FROM message m
        INNER JOIN channel c ON c.id = m."channelId"
        WHERE c."serverId" = pcs."userServerId"
          AND m.type != 'draft'
          AND m.deleted = false
          AND m."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days'
      ),
      "messageCountYear" = (
        SELECT COUNT(*)
        FROM message m
        INNER JOIN channel c ON c.id = m."channelId"
        WHERE c."serverId" = pcs."userServerId"
          AND m.type != 'draft'
          AND m.deleted = false
          AND m."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '365 days'
      ),
      "lastMessageAt" = COALESCE((
        SELECT MAX(m."createdAt")
        FROM message m
        INNER JOIN channel c ON c.id = m."channelId"
        WHERE c."serverId" = pcs."userServerId"
          AND m.type != 'draft'
          AND m.deleted = false
      ), CURRENT_TIMESTAMP),
      score = CASE
        WHEN (
          SELECT COUNT(*)
          FROM message m
          INNER JOIN channel c ON c.id = m."channelId"
          WHERE c."serverId" = pcs."userServerId"
            AND m.type != 'draft'
            AND m.deleted = false
            AND m."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '7 days'
        ) > 0 
        THEN (
          SELECT COUNT(*)
          FROM message m
          INNER JOIN channel c ON c.id = m."channelId"
          WHERE c."serverId" = pcs."userServerId"
            AND m.type != 'draft'
            AND m.deleted = false
            AND m."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '7 days'
        ) * 10 + (
          SELECT COUNT(*)
          FROM message m
          INNER JOIN channel c ON c.id = m."channelId"
          WHERE c."serverId" = pcs."userServerId"
            AND m.type != 'draft'
            AND m.deleted = false
            AND m."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days'
        )
        ELSE (
          SELECT COUNT(*)
          FROM message m
          INNER JOIN channel c ON c.id = m."channelId"
          WHERE c."serverId" = pcs."userServerId"
            AND m.type != 'draft'
            AND m.deleted = false
            AND m."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days'
        ) * 2 + (
          SELECT COUNT(*)
          FROM message m
          INNER JOIN channel c ON c.id = m."channelId"
          WHERE c."serverId" = pcs."userServerId"
            AND m.type != 'draft'
            AND m.deleted = false
            AND m."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '365 days'
        )
      END,
      "lastRefreshedAt" = CURRENT_TIMESTAMP;
  `)
}
