import { number, string, table } from '@rocicorp/zero'
import { randomId } from '@take-out/helpers'
import { mutations, serverWhere } from 'on-zero'

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

const permissions = serverWhere('report', (_, auth) => {
  return _.cmp('reporterId', auth?.id || '')
})

export const mutate = mutations(schema, permissions, {
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
