import { sql } from '~/database/sql'

/**
 * Calls the database function to populate private chat stats for a given server.
 * This creates initial stats entries for all private chats where both users are members.
 */
export async function populatePrivateChatStatsForServer(serverId: string) {
  await sql`SELECT populate_private_chats_stats_for_server(${serverId})`
}
