/**
 * SSR test page for verifying serverWhere properly filters during SSR render.
 * This page fetches posts server-side with notBlockedByViewer and renders them.
 * Integration tests verify blocked users' posts don't appear in the SSR HTML.
 */

import { createRoute, useLoader } from 'one'
import { Text, YStack } from 'tamagui'

const route = createRoute<'/test/ssr-permissions'>()

export const loader = route.createLoader(async ({ request }) => {
  // dynamic imports to prevent metro from bundling server-only modules into native
  const { zql } = await import('on-zero')
  const { notBlockedByViewer } = await import('~/data/where/notBlockedByViewer')
  const { zeroServer } = await import('~/zero/server')

  const url = new URL(request!.url)
  const viewerId = url.searchParams.get('viewerId')

  const authData = viewerId ? { id: viewerId, role: undefined } : null
  const posts = await zeroServer.query(authData, () =>
    zql.post
      .where(notBlockedByViewer)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .related('user', (q) => q.one()),
  )

  return {
    viewerId,
    posts: posts.map((p) => ({
      id: p.id,
      userId: p.userId,
      caption: p.caption,
    })),
  }
})

export function SSRPermissionsTestPage() {
  const { viewerId, posts } = useLoader(loader)

  return (
    <YStack p="4" gap="2">
      <Text fontSize="6" fontWeight="bold">
        SSR Permissions Test
      </Text>
      <Text color="color10" data-testid="ssr-viewer-id">
        Viewer: {viewerId || 'anonymous'}
      </Text>
      <Text color="color10" data-testid="ssr-post-count">
        Posts: {posts.length}
      </Text>

      <YStack gap="1" mt="4">
        {posts.map((post) => (
          <Text key={post.id} data-testid={`ssr-post-${post.id}`}>
            {post.id} (by {post.userId}): {post.caption?.slice(0, 50)}
          </Text>
        ))}
      </YStack>

      {/* hidden data for easy test assertions */}
      <div
        data-testid="ssr-post-ids"
        style={{ display: 'none' }}
        dangerouslySetInnerHTML={{ __html: posts.map((p) => p.id).join(',') }}
      />
      <div
        data-testid="ssr-user-ids"
        style={{ display: 'none' }}
        dangerouslySetInnerHTML={{ __html: posts.map((p) => p.userId).join(',') }}
      />
    </YStack>
  )
}
