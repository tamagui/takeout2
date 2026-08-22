import { mutations, serverWhere } from 'on-zero'

const permissions = serverWhere('report', (_, auth) => {
  return _.cmp('reporterId', auth?.id || '')
})

export const mutate = mutations('report', permissions, {
  reportPost: async (
    { tx, authData },
    data: {
      id: string
      createdAt: number
      postId: string
      reason: string
      details?: string
    },
  ) => {
    if (!authData) throw new Error('Not authenticated')

    await tx.mutate.report.insert({
      id: data.id,
      reporterId: authData.id,
      reportedPostId: data.postId,
      reportedUserId: undefined,
      reason: data.reason,
      details: data.details,
      status: 'pending',
      reviewedBy: undefined,
      reviewedAt: undefined,
      createdAt: data.createdAt,
    })
  },

  reportUser: async (
    { tx, authData },
    data: {
      id: string
      createdAt: number
      userId: string
      reason: string
      details?: string
    },
  ) => {
    if (!authData) throw new Error('Not authenticated')

    await tx.mutate.report.insert({
      id: data.id,
      reporterId: authData.id,
      reportedUserId: data.userId,
      reportedPostId: undefined,
      reason: data.reason,
      details: data.details,
      status: 'pending',
      reviewedBy: undefined,
      reviewedAt: undefined,
      createdAt: data.createdAt,
    })
  },
})
