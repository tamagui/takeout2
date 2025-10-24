import { and, eq } from 'drizzle-orm'
import { getDb } from '~/database'
import { meeting as meetingTable, meetingUser } from '~/database/schema-public'
import { ensure, ensureString } from '@vxrn/helpers'
import { CLOUDFLARE_REALTIME_AUTH_HEADER } from '~/server/env-server'

export type RealtimeActions = typeof realtimeActions

export const realtimeActions = {
  async createMeeting(channelId: string) {
    ensure(!!CLOUDFLARE_REALTIME_AUTH_HEADER, 'CLOUDFLARE_REALTIME_AUTH_HEADER')

    const db = getDb()

    const [existingMeeting] = await db
      .select()
      .from(meetingTable)
      .where(and(eq(meetingTable.channelId, channelId), eq(meetingTable.active, true)))
      .limit(1)

    if (existingMeeting?.authToken) {
      return {
        meetingId: existingMeeting.id,
        cloudflareId: existingMeeting.cloudflareId,
        authToken: existingMeeting.authToken,
        exists: true,
      }
    }

    // create a new meeting in cloudflare
    const cloudflareResponse = await fetch(
      'https://api.realtime.cloudflare.com/v2/meetings',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${CLOUDFLARE_REALTIME_AUTH_HEADER}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Meeting for channel ${channelId}`,
          preferred_region: 'us-east-1',
          record_on_start: false,
        }),
      }
    )

    if (!cloudflareResponse.ok) {
      const error = await cloudflareResponse.text()
      console.error('Failed to create meeting:', error)
      throw new Error('Failed to create meeting')
    }

    const cloudflareData = await cloudflareResponse.json()
    const cloudflareId = cloudflareData.data.id

    ensureString(cloudflareId)

    return { cloudflareId, exists: false }
  },

  async addParticipant(
    name: string,
    picture: string,
    cloudflareId: string,
    userId: string
  ) {
    ensure(cloudflareId, 'cloudflareId')

    const participantData = {
      name,
      picture,
      preset_name: 'group_call_host',
      client_specific_id: userId,
    }

    console.info(`[cloudflare] adding user`, participantData)

    const response = await fetch(
      `https://api.realtime.cloudflare.com/v2/meetings/${cloudflareId}/participants`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${CLOUDFLARE_REALTIME_AUTH_HEADER}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(participantData),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to add participant:', error)
      throw new Error('Failed to add participant')
    }

    const data = await response.json()
    const participantToken = data.data.token

    return { authToken: participantToken }
  },

  async leaveMeeting(meetingId: string, userId: string) {
    const db = getDb()

    await db
      .update(meetingUser)
      .set({
        active: false,
        leftAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(meetingUser.meetingId, meetingId),
          eq(meetingUser.userId, userId),
          eq(meetingUser.active, true)
        )
      )
  },
}
