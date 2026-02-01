import { serverWhere } from 'on-zero'

// filters out posts whose author is blocked by the authenticated user
// on server: uses not(exists()) to filter - blocked posts never sync to client
// on client (web + native): becomes no-op (always passes) since serverWhere skips client-side
export const notBlockedByViewer = serverWhere('post', (q, auth) => {
  if (!auth?.id) return true
  return q.not(q.exists('authorBlockedBy', (block) => block.where('blockerId', auth.id)))
})
