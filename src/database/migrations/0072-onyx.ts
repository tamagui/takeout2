import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // fix race condition in populate_private_chats_stats_for_server function
  // use ON CONFLICT DO NOTHING to handle concurrent inserts
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
      ON CONFLICT ("serverId", "userServerId") DO NOTHING;
    END;
    $$ LANGUAGE plpgsql;
  `)
}
