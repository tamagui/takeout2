import type { Endpoint } from 'one'
import { parse } from 'valibot'
import { ensureAuth } from '~/auth/server/ensureAuth'
import { SearchProps } from '~/features/search/helpers/fetchSearch'
import { searchChat } from '~/features/search/searchSimple'

/**
 * This endpoint searches for chat messages in a specific server
 * and returns them with user information
 */

export const POST: Endpoint = async (req) => {
  await ensureAuth(req)

  const body = await req.json()
  const { query, serverId } = parse(SearchProps, body)

  console.warn('[search]', query, 'in', serverId)

  try {
    // use simplified search for chat messages
    const results = await searchChat({ query, serverId, limit: 5 })

    console.info('found', results.length, 'results')

    return Response.json(results)
  } catch (err) {
    console.error(`Error searching: ${err}`)
    return Response.json([])
  }
}
