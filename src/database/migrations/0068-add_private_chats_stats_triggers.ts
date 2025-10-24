import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // create function to update stats when a message is inserted
  await client.query(`
    CREATE OR REPLACE FUNCTION update_private_chats_stats_on_message()
    RETURNS TRIGGER AS $$
    DECLARE
      private_server RECORD;
      parent_server_id varchar;
    BEGIN
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
          "lastMessageAt" = NEW."createdAt",
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

  // create trigger
  await client.query(`
    CREATE TRIGGER update_private_chats_stats_on_message_trigger
    AFTER INSERT ON message
    FOR EACH ROW
    EXECUTE FUNCTION update_private_chats_stats_on_message();
  `)
}
