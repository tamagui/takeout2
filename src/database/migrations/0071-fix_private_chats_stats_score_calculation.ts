import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // fix the score calculation in the trigger to use the updated counts
  await client.query(`
    CREATE OR REPLACE FUNCTION update_private_chats_stats_on_message()
    RETURNS TRIGGER AS $$
    DECLARE
      private_server RECORD;
      parent_server_id varchar;
      new_week_count integer;
      new_month_count integer;
      new_year_count integer;
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
        -- calculate new counts
        SELECT 
          COALESCE("messageCountWeek", 0) + CASE 
            WHEN NEW."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 
            ELSE 0 
          END,
          COALESCE("messageCountMonth", 0) + CASE
            WHEN NEW."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1
            ELSE 0
          END,
          COALESCE("messageCountYear", 0) + CASE
            WHEN NEW."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '365 days' THEN 1
            ELSE 0
          END
        INTO new_week_count, new_month_count, new_year_count
        FROM "privateChatsStats"
        WHERE "serverId" = parent_server_id 
          AND "userServerId" = private_server.id;
        
        -- if no existing record, start with 1s
        IF new_week_count IS NULL THEN
          new_week_count := CASE WHEN NEW."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 ELSE 0 END;
          new_month_count := CASE WHEN NEW."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 ELSE 0 END;
          new_year_count := CASE WHEN NEW."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '365 days' THEN 1 ELSE 0 END;
        END IF;
        
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
          CASE
            WHEN new_week_count > 0 
            THEN new_week_count * 10 + new_month_count
            ELSE new_month_count * 2 + new_year_count
          END,
          NEW."createdAt",
          new_week_count,
          new_month_count,
          new_year_count,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT ("serverId", "userServerId") DO UPDATE SET
          "lastMessageAt" = GREATEST("privateChatsStats"."lastMessageAt", NEW."createdAt"),
          "messageCountWeek" = new_week_count,
          "messageCountMonth" = new_month_count,
          "messageCountYear" = new_year_count,
          score = CASE
            WHEN new_week_count > 0 
            THEN new_week_count * 10 + new_month_count
            ELSE new_month_count * 2 + new_year_count
          END,
          "lastRefreshedAt" = CURRENT_TIMESTAMP;
      END LOOP;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // recalculate all scores with the correct formula
  await client.query(`
    UPDATE "privateChatsStats"
    SET score = CASE
      WHEN "messageCountWeek" > 0 
      THEN "messageCountWeek" * 10 + "messageCountMonth"
      ELSE "messageCountMonth" * 2 + "messageCountYear"
    END;
  `)
}
