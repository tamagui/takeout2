import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // create accepted invites for all existing users so they don't get locked out
  // we'll create invites for their primary server (first serverMember record)
  await client.query(`
    INSERT INTO invite (id, email, "serverId", "inviterId", accepted, "acceptedAt", "acceptedById", "expiresAt", "createdAt")
    SELECT 
      'inv_retro_' || u.id as id,
      u.email,
      COALESCE(
        (SELECT sm."serverId" 
         FROM "serverMember" sm 
         WHERE sm."userId" = u.id 
         ORDER BY sm."joinedAt" ASC 
         LIMIT 1),
        (SELECT s.id 
         FROM server s 
         WHERE s."userId" = u.id OR s."creatorId" = u.id 
         LIMIT 1)
      ) as "serverId",
      u.id as "inviterId",
      true as accepted,
      NOW() as "acceptedAt",
      u.id as "acceptedById",
      NOW() + INTERVAL '10 years' as "expiresAt",
      NOW() as "createdAt"
    FROM "user" u
    WHERE u.email IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM invite i 
      WHERE i.email = u.email 
      AND i.accepted = true
    )
    AND (
      EXISTS (SELECT 1 FROM "serverMember" sm WHERE sm."userId" = u.id)
      OR EXISTS (SELECT 1 FROM server s WHERE s."userId" = u.id OR s."creatorId" = u.id)
    )
  `)

  console.info('Created retroactive invites for existing users')
}
