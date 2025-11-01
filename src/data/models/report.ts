import { boolean, number, string, table } from '@rocicorp/zero'
import { mutations, where, type TableInsertRow } from 'over-zero'
import { randomId } from '@vxrn/helpers'

export type Report = TableInsertRow<typeof schema>

// schema for content and user reports
export const schema = table('report')
  .columns({
    id: string(),
    reporterId: string(),
    reportedUserId: string().optional(),
    reportedPostId: string().optional(),
    reason: string(),
    details: string().optional(),
    status: string(), // pending, reviewed, resolved
    reviewedBy: string().optional(),
    reviewedAt: number().optional(),
    createdAt: number(),
  })
  .primaryKey('id')

// permissions - reports are private, only accessible via mutations
const permissions = where('report', (_, auth) => {
  return _.cmpLit(auth?.role || '', '=', 'admin')
})

// mutations
export const mutate = mutations(schema, permissions, {
  // report a post
  reportPost: async (
    { tx, authData },
    data: {
      postId: string
      reason: string
      details?: string
    }
  ) => {
    if (!authData) throw new Error('Not authenticated')

    await tx.mutate.report.insert({
      id: randomId(),
      reporterId: authData.id,
      reportedPostId: data.postId,
      reportedUserId: undefined,
      reason: data.reason,
      details: data.details,
      status: 'pending',
      reviewedBy: undefined,
      reviewedAt: undefined,
      createdAt: Date.now(),
    })
  },

  // report a user
  reportUser: async (
    { tx, authData },
    data: {
      userId: string
      reason: string
      details?: string
    }
  ) => {
    if (!authData) throw new Error('Not authenticated')

    await tx.mutate.report.insert({
      id: randomId(),
      reporterId: authData.id,
      reportedUserId: data.userId,
      reportedPostId: undefined,
      reason: data.reason,
      details: data.details,
      status: 'pending',
      reviewedBy: undefined,
      reviewedAt: undefined,
      createdAt: Date.now(),
    })
  },
})
