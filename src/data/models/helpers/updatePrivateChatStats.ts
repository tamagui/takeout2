import { sql } from '~/database/sql'

/**
 * Ensures private chat stats exist for all private chats where both users are members of the given server.
 * Returns the count of stats entries that were inserted or updated.
 */
export async function updatePrivateChatStats(serverId: string) {
  const result = await sql`
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
      ${serverId} as "serverId",
      pcs.id as "userServerId",
      LEAST(pcs."userId", pcs."friendId") as "userAId",
      GREATEST(pcs."userId", pcs."friendId") as "userBId",
      0 as score,
      CURRENT_TIMESTAMP as "lastMessageAt",
      0 as "messageCountWeek",
      0 as "messageCountMonth",
      0 as "messageCountYear",
      CURRENT_TIMESTAMP as "lastRefreshedAt"
    FROM server pcs
    INNER JOIN "serverMember" sm1 ON sm1."userId" = pcs."userId" AND sm1."serverId" = ${serverId}
    INNER JOIN "serverMember" sm2 ON sm2."userId" = pcs."friendId" AND sm2."serverId" = ${serverId}
    WHERE pcs."isPrivateChat" = true
      AND pcs."userId" IS NOT NULL
      AND pcs."friendId" IS NOT NULL
    ON CONFLICT ("serverId", "userServerId") DO UPDATE SET
      "lastRefreshedAt" = CURRENT_TIMESTAMP
    RETURNING *
  `

  return Array.isArray(result.rows) ? result.rows.length : 0
}
