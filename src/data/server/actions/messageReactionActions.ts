import { sql } from '~/database/sql'

async function updateUserTopReactions(userId: string) {
  const result = await sql`
    WITH user_reaction_counts AS (
      SELECT
        mr."creatorId",
        mr."reactionId"::text,
        COUNT(*) as use_count
      FROM "messageReaction" mr
      WHERE mr."creatorId" = ${userId}
      GROUP BY mr."creatorId", mr."reactionId"
    ),
    ranked_reactions AS (
      SELECT
        "creatorId",
        "reactionId",
        ROW_NUMBER() OVER (PARTITION BY "creatorId" ORDER BY use_count DESC) as rank
      FROM user_reaction_counts
    ),
    top_reactions AS (
      SELECT
        "creatorId",
        json_agg(
          "reactionId"::text
          ORDER BY rank
        ) as top_reactions
      FROM ranked_reactions
      WHERE rank <= 5
      GROUP BY "creatorId"
    )
    SELECT top_reactions FROM top_reactions
  `

  const topReactions = result.rows[0]?.top_reactions ?? []

  await sql`
    INSERT INTO "userState" (id, "userId", "topReactions")
    VALUES (${userId}, ${userId}, ${JSON.stringify(topReactions)}::jsonb)
    ON CONFLICT ("userId") DO UPDATE SET
      "topReactions" = EXCLUDED."topReactions"
  `
}

export const messageReactionActions = {
  updateUserTopReactions,
}
