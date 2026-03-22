/**
 * SSR test page for verifying serverWhere properly filters during SSR render.
 * This page fetches posts server-side with notBlockedByViewer and renders them.
 * Integration tests verify blocked users' posts don't appear in the SSR HTML.
 */

import { zql } from 'on-zero'
import { createRoute, useLoader } from 'one'
import { Text, YStack } from 'tamagui'

import { notBlockedByViewer } from '~/data/where/notBlockedByViewer'
import { zeroServer } from '~/zero/server'

import type { AuthData } from 'on-zero'

const route = createRoute<'/test/ssr-permissions'>()

export const loader = route.createLoader(async ({ request }) => {
  const url = new URL(request!.url)
  const viewerId = url.searchParams.get('viewerId')

  // fetch posts as the specified viewer (or anonymous if not provided)
  const authData: AuthData | null = viewerId
    ? { id: viewerId, email: '', role: undefined }
    : null

  const posts = await zeroServer.query(
    () =>
      zql.post
        .where(notBlockedByViewer)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .related('user', (q) => q.one()),
    authData,
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
    <YStack p="$4" gap="$2">
      <Text fontSize="$6" fontWeight="bold">
        SSR Permissions Test
      </Text>
      <Text color="$color10" data-testid="ssr-viewer-id">
        Viewer: {viewerId || 'anonymous'}
      </Text>
      <Text color="$color10" data-testid="ssr-post-count">
        Posts: {posts.length}
      </Text>

      <YStack gap="$1" mt="$4">
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
