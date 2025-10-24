import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // update all messages to use % separator instead of : in mentions
  // format: <@{type:label:id}> -> <@{type%label%id}>
  await client.query(`
    UPDATE message
    SET content = regexp_replace(
      content,
      '<@{([^:}]+):([^:}]+):([^}]+)}>',
      '<@{\\1%\\2%\\3}>',
      'g'
    )
    WHERE content LIKE '%<@{%:%:%}%'
  `)
}
