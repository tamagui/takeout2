/**
 * API test endpoint for verifying serverWhere properly filters posts.
 * Returns JSON with post data filtered by notBlockedByViewer.
 * Integration tests verify blocked users' posts don't appear.
 */

import { zql } from 'on-zero'

import { notBlockedByViewer } from '~/data/where/notBlockedByViewer'
import { authDataToClaims, zeroServer } from '~/zero/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const viewerId = url.searchParams.get('viewerId')

  const claims = authDataToClaims(viewerId ? { id: viewerId, role: undefined } : null)
  const posts = await zeroServer.query(claims, () =>
    zql.post
      .where(notBlockedByViewer)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .related('user', (q) => q.one()),
  )

  const postData = posts.map((p) => ({
    id: p.id,
    userId: p.userId,
    caption: p.caption,
  }))

  return Response.json({
    viewerId,
    posts: postData,
    postIds: postData.map((p) => p.id),
  })
}
