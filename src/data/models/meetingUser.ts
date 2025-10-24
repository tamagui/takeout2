import { boolean, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'

export type MeetingUser = TableInsertRow<typeof schema>

export const schema = table('meetingUser')
  .columns({
    meetingId: string(),
    userId: string(),
    participantToken: string().optional(),
    joinedAt: number(),
    leftAt: number().optional(),
    active: boolean(),
  })
  .primaryKey('meetingId', 'userId')

export const permissions = where('meetingUser', (_, auth) => {
  return {
    read: true,
    write: true,
  }
})

export const mutate = mutations(schema, permissions, {})
