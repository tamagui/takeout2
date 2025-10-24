import type { Endpoint } from 'one'
import { number, object, optional, parse, string } from 'valibot'
import { ensureAuth } from '~/auth/server/ensureAuth'
import { searchActions } from '~/features/search/searchActions'

const SearchDevProps = object({
  query: string(),
  searchType: optional(string(), 'search'),
  page: optional(number(), 0),
})

export const POST: Endpoint = async (req) => {
  await ensureAuth(req)

  const body = await req.json()
  const { query, searchType = 'search', page = 0 } = parse(SearchDevProps, body)

  console.info('[search-dev]', searchType, query, 'page', page)

  try {
    const params = {
      limit: 10,
      offset: 10 * page,
    }

    let results
    switch (searchType) {
      case 'library':
        results = await searchActions.searchLibrary(query, params)
        break
      case 'exact':
        results = await searchActions.searchExact(query, params)
        break
      case 'fuzzy':
        results = await searchActions.searchFuzzy(query, params)
        break
      case 'vector':
        results = await searchActions.searchVector(query, params)
        break
      // case 'search':
      default:
        results = await searchActions.search(query, params)
        break
    }

    return Response.json({
      results,
      totalCount: results.length,
      searchType,
      query,
    })
  } catch (err: any) {
    console.error(`Error in search-dev: ${err}`)
    return Response.json({ error: err.message, results: [], totalCount: 0 })
  }
}
