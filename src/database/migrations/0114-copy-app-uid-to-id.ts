import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // first, find the foreign key constraint name
  const fkResult = await client.query(`
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = '"appInstall"'::regclass
    AND confrelid = 'app'::regclass
    AND contype = 'f'
  `)

  if (fkResult.rows.length > 0) {
    const fkName = fkResult.rows[0].conname

    // drop the foreign key constraint temporarily
    await client.query(`ALTER TABLE "appInstall" DROP CONSTRAINT "${fkName}"`)
  }

  // store old app.id values to update references
  await client.query(`
    CREATE TEMP TABLE app_id_mapping AS
    SELECT id as old_id, uid as new_id FROM app WHERE id != uid OR id IS NULL
  `)

  // update appInstall references to use the uid values
  await client.query(`
    UPDATE "appInstall"
    SET "appId" = m.new_id
    FROM app_id_mapping m
    WHERE "appInstall"."appId" = m.old_id
  `)

  // copy uid values to id column for app table
  await client.query(`UPDATE app SET id = uid`)

  // re-create the foreign key constraint
  await client.query(`
    ALTER TABLE "appInstall"
    ADD CONSTRAINT "appInstall_appId_app_id_fk"
    FOREIGN KEY ("appId") REFERENCES app(id) ON DELETE CASCADE
  `)

  // clean up temp table
  await client.query(`DROP TABLE IF EXISTS app_id_mapping`)
}
