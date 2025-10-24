import type { Endpoint } from 'one'
import { ensureAuth } from '~/auth/server/ensureAuth'
import { searchClient } from '~/features/search/searchClient'

export const GET: Endpoint = async (req) => {
  await ensureAuth(req, 'admin')

  const url = new URL(req.url)
  const page = Number.parseInt(url.searchParams.get('page') || '1')
  const limit = Number.parseInt(url.searchParams.get('limit') || '50')
  const isExport = url.searchParams.get('export') === 'true'

  try {
    // handle export request - fetch all documents
    if (isExport) {
      const allDocuments = await searchClient.searchFullText({
        query: '*',
        limit: 10000, // large limit for export
      })

      // format documents in export-data format
      const exportData = allDocuments.map((doc) => ({
        id: doc.id || null,
        key: doc.title || null,
        value: doc.content || null,
        permissions: null,
        reliability: doc.reliability || null,
        type: doc.type || null,
        createdAt: null,
        updatedAt: null,
        serverId: doc.server || null,
        channelId: null,
        appInstallId: doc.appInstallId || null,
        creatorId: null,
        title: doc.title || null,
      }))

      return Response.json(exportData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="search-documents-export.json"',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      })
    }

    // regular pagination logic
    const results = await searchClient.searchFullText({
      query: '*',
      limit: limit,
    })

    const totalCount = await searchClient.getTotalDocuments()

    const documents = results.map((doc) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content?.substring(0, 200) + '...',
      type: doc.type,
      category: doc.category,
      server: doc.server,
      reliability: doc.reliability,
    }))

    return Response.json(
      {
        documents,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit) || 1,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (error) {
    console.error('Search error:', error)
    return Response.json({ error: 'Search operation failed' }, { status: 500 })
  }
}

export const POST: Endpoint = async (req) => {
  await ensureAuth(req, 'admin')

  const body = await req.json()
  const { action, id, document } = body

  try {
    switch (action) {
      case 'create':
        // triggers handle indexing automatically
        return Response.json({
          success: true,
          message: 'Document creation handled by triggers',
        })

      case 'update':
        // triggers handle indexing automatically
        return Response.json({
          success: true,
          message: 'Document update handled by triggers',
        })

      case 'searchByFilters': {
        const { filters } = body
        // simplified search - just use full text for now
        const results = await searchClient.searchFullText({
          query: filters?.query || '*',
          limit: 50,
        })

        return Response.json({
          documents: results,
          totalCount: results.length,
        })
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Search admin operation failed:', error)
    return Response.json({ error: 'Operation failed' }, { status: 500 })
  }
}
