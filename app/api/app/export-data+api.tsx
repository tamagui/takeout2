import { assertString } from '@vxrn/helpers'
import type { Endpoint } from 'one'
import { ensureAuth } from '~/auth/server/ensureAuth'
import { zeroServer } from '~/zero/server'

export const GET: Endpoint = async (req) => {
  await ensureAuth(req)

  const { searchParams } = new URL(req.url)
  const appInstallId = assertString(searchParams.get('appInstallId'), 'appInstallId')
  const serverId = assertString(searchParams.get('serverId'), 'serverId')

  try {
    // Get all data items for this app install and server in chunks
    const allItems: any[] = []
    let lastCreatedAt: number | null = null
    const limit = 100

    while (true) {
      const chunk = await zeroServer.query(async (q) => {
        let baseQuery = q.data
          .where('serverId', serverId)
          .where('appInstallId', appInstallId)
          .orderBy('createdAt', 'asc')
          .limit(limit)

        if (lastCreatedAt !== null) {
          baseQuery = baseQuery.where('createdAt', '>', lastCreatedAt)
        }

        return baseQuery
      })

      if (!chunk.length) break

      // For each chunk, get corresponding Typesense docs
      const enrichedChunk = await Promise.all(
        chunk.map(async (item) => {
          // search documents are automatically synced via triggers
          // no need to retrieve from search index
          // just return the data item directly

          return {
            id: item.id,
            key: item.key,
            value: item.value,
            permissions: item.permissions,
            reliability: item.reliability,
            type: item.type,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            serverId: item.serverId,
            channelId: item.channelId,
            appInstallId: item.appInstallId,
            creatorId: item.creatorId,
            title: item.title,
          }
        })
      )

      // Filter out null items
      allItems.push(...enrichedChunk.filter(Boolean))

      // Update lastCreatedAt for next iteration
      if (chunk.length > 0) {
        lastCreatedAt = chunk[chunk.length - 1]?.createdAt ?? null
      }

      if (chunk.length < limit) break
    }

    // Create JSON response with proper headers for file download
    const jsonData = JSON.stringify(allItems, null, 2)

    return new Response(jsonData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="app-data-${appInstallId}-${serverId}-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error('Error exporting app data:', error)
    return Response.json(
      {
        error: true,
        message: `Error exporting app data: ${(error as any).message}`,
      },
      {
        status: 500,
      }
    )
  }
}
