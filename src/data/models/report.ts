import { boolean, number, string, table } from '@rocicorp/zero'
import { mutations, where, type TableInsertRow } from 'over-zero'
import { randomId } from '@vxrn/helpers'

export type Report = TableInsertRow<typeof schema>

// schema for content and user reports
export const schema = table('report')
  .columns({
    id: string(),
    reporterId: string(),
    targetType: string(), // 'post' or 'user'
    targetId: string(), // postId or userId
    reason: string(), // 'inappropriate', 'spam', 'harassment', 'other'
    details: string(), // optional details
    resolved: boolean(),
    createdAt: number(),
  })
  .primaryKey('id')

// permissions - reports are private, only accessible via mutations
export const permissions = where('report', (_, auth) => {
  return {
    read: _.cmpLit(auth?.role || '', '=', 'admin'), // reports are private, only admins can read
    write: _.cmpLit(auth?.role || '', '=', 'admin'), // only admin can do direct write, other users should use mutation
  }
})

// mutations
export const mutate = mutations(schema, permissions, {
  // generic insert for reports
  insert: async (
    { tx, authData },
    report: {
      targetType: 'post' | 'user'
      targetId: string
      reason: string
      details?: string
    }
  ) => {
    if (!authData) throw new Error('Not authenticated')

    await tx.mutate.report.insert({
      id: randomId(),
      reporterId: authData.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      details: report.details || '',
      resolved: false,
      createdAt: Date.now(),
    })
  },

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
      targetType: 'post',
      targetId: data.postId,
      reason: data.reason,
      details: data.details || '',
      resolved: false,
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
      targetType: 'user',
      targetId: data.userId,
      reason: data.reason,
      details: data.details || '',
      resolved: false,
      createdAt: Date.now(),
    })
  },
})
