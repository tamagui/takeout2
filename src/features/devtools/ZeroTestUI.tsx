import { memo, useEffect, useState } from 'react'
import { isWeb } from 'tamagui'

import { feedPosts } from '~/data/queries/post'
import { useAuth } from '~/features/auth/client/authClient'
import { usePermission, useQuery } from '~/zero/client'

// hidden panel toggled by ctrl+shift+alt+p, surfaces permission/query state for e2e tests
export const ZeroTestUI = memo(() => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isWeb) return
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!open) return null

  return <ZeroTestUIContent />
})

const ZeroTestUIContent = memo(() => {
  const { user } = useAuth()

  // fetch all feed posts (enough to see blocked/unblocked)
  const [posts] = useQuery(feedPosts, { pageSize: 50 })

  // check permissions on a few known seed posts
  const ownPostIds = posts?.filter((p) => p.userId === user?.id).map((p) => p.id) ?? []
  const otherPostIds = posts?.filter((p) => p.userId !== user?.id).map((p) => p.id) ?? []

  const firstOwnPostId = ownPostIds[0]
  const firstOtherPostId = otherPostIds[0]

  const permOwnPost = usePermission('post', firstOwnPostId, !!firstOwnPostId)
  const permOtherPost = usePermission('post', firstOtherPostId, !!firstOtherPostId)

  // check specific seed posts
  const permSeedPost1 = usePermission('post', 'seed-post-1', true)
  const permSeedPost2 = usePermission('post', 'seed-post-2', true)

  // list all visible post ids for block testing
  const visiblePostIds = posts?.map((p) => p.id).join(',') ?? ''
  const visibleUserIds = [...new Set(posts?.map((p) => p.userId) ?? [])].join(',')

  return (
    <div
      data-testid="zero-test-ui"
      style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        zIndex: 99999,
        background: '#1a1a2e',
        border: '1px solid #444',
        borderRadius: 8,
        padding: 12,
        minWidth: 320,
        maxHeight: 500,
        overflow: 'auto',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#eee',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>zero test ui</div>

      <Row label="user-id" value={user?.id} />
      <Row label="user-name" value={user?.name} />
      <Row label="post-count" value={String(posts?.length ?? 0)} />
      <Row label="visible-post-ids" value={visiblePostIds} />
      <Row label="visible-user-ids" value={visibleUserIds} />
      <Row label="own-post-id" value={firstOwnPostId} />
      <Row label="other-post-id" value={firstOtherPostId} />
      <Row label="perm-own-post" value={permStr(permOwnPost)} />
      <Row label="perm-other-post" value={permStr(permOtherPost)} />
      <Row label="perm-seed-post-1" value={permStr(permSeedPost1)} />
      <Row label="perm-seed-post-2" value={permStr(permSeedPost2)} />
    </div>
  )
})

function permStr(v: boolean | null | undefined): string {
  if (v === null || v === undefined) return 'null'
  return v ? 'true' : 'false'
}

const Row = memo(({ label, value }: { label: string; value?: string | null }) => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
    <span style={{ minWidth: 150, opacity: 0.6 }}>{label}</span>
    <span data-testid={`zt-${label}`} style={{ wordBreak: 'break-all' }}>
      {value || '—'}
    </span>
  </div>
))
