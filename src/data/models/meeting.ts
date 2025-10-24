import { boolean, number, string, table } from '@rocicorp/zero'
import { ensure } from '@vxrn/helpers'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'
import { hasChannelReadPermission } from '~/data/where/channel'

export type Meeting = TableInsertRow<typeof schema>

export const schema = table('meeting')
  .columns({
    id: string(),
    serverId: string(),
    channelId: string(),
    creatorId: string(),
    cloudflareId: string(),
    authToken: string().optional(),
    active: boolean(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('id')

export const permissions = where('meeting', (_, auth) => {
  const isUserMember = _.exists('server', (q) =>
    q.whereExists('member', (q) => q.where('id', auth?.id || ''))
  )

  return {
    read: _.and(isUserMember, hasChannelReadPermission(_, auth)),
    write: _.or(
      _.cmp('creatorId', auth?.id || ''),
      _.cmpLit(auth?.role || '', '=', 'admin')
    ),
  }
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, authData, server }, meeting: Meeting) => {
    if (!server) {
      await tx.mutate.meeting.insert({
        ...meeting,
        active: true,
      })
      return
    }

    ensure(authData)

    const createdMeeting = await server.actions.realtime.createMeeting(meeting.channelId)

    console.info(`[meeting] cloudflare created`, createdMeeting)

    const { cloudflareId, authToken } = createdMeeting
    await tx.mutate.meeting.upsert({
      ...meeting,
      cloudflareId,
      authToken,
      active: true,
    })

    // call join for the creator inline since we can't call other mutators from within
    await tx.mutate.meetingUser.upsert({
      meetingId: meeting.id,
      userId: meeting.creatorId,
      active: true,
      joinedAt: meeting.createdAt,
    })

    const participantData = await server.actions.realtime.addParticipant(
      authData.email,
      'https://storage.start.chat/onechatimages/uploads/zx6urtz7ljg-/Users/n8/Desktop/5dvhtbozp9w-avatar.png',
      cloudflareId,
      authData.id
    )

    await tx.mutate.meetingUser.update({
      meetingId: meeting.id,
      userId: authData.id,
      participantToken: participantData.authToken,
    })
  },

  join: async (
    { tx, authData, server },
    {
      meetingId,
      cloudflareId,
      joinedAt,
      userId,
    }: {
      meetingId: string
      cloudflareId: string
      joinedAt: number
      userId: string
    }
  ) => {
    await tx.mutate.meetingUser.upsert({
      meetingId,
      userId,
      active: true,
      joinedAt,
    })

    if (server) {
      ensure(authData)

      const participantData = await server.actions.realtime.addParticipant(
        authData.email,
        'https://storage.start.chat/onechatimages/uploads/zx6urtz7ljg-/Users/n8/Desktop/5dvhtbozp9w-avatar.png',
        cloudflareId,
        authData.id
      )

      await tx.mutate.meetingUser.update({
        meetingId,
        userId: authData.id,
        participantToken: participantData.authToken,
      })
    }
  },

  leave: async (
    { tx, server },
    {
      meetingId,
      leftAt,
      userId,
    }: {
      userId: string
      meetingId: string
      leftAt: number
    }
  ) => {
    await tx.mutate.meetingUser.update({
      meetingId,
      userId,
      active: false,
      leftAt,
    })

    await server?.actions.realtime.leaveMeeting(meetingId, userId)
  },
})
