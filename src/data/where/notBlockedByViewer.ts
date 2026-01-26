import { serverWhere } from 'over-zero'

// filters out posts whose author is blocked by the authenticated user
export const notBlockedByViewer = serverWhere('post', (q, auth) => {
  if (!auth?.id) return true
  return q.not(q.exists('authorBlockedBy', (block) => block.where('blockerId', auth.id)))
})
