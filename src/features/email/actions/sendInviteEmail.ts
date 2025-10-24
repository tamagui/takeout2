import { eq } from 'drizzle-orm'
import { getDb } from '~/database'
import * as schema from '~/database/schema'
import { ONE_SERVER_URL } from '~/server/env-server'
import { sendHtmlEmail } from '../sendHtmlEmail'

export async function sendInviteEmail({
  inviteId,
  email,
  serverId,
  roleId,
  inviterId,
}: {
  inviteId: string
  email: string
  serverId: string
  roleId?: string
  inviterId: string
}) {
  const db = getDb()

  // fetch additional data needed for the email
  const [server, inviter, role] = await Promise.all([
    db.query.server.findFirst({
      where: eq(schema.server.id, serverId),
    }),
    db.query.userPublic.findFirst({
      where: eq(schema.userPublic.id, inviterId),
    }),
    roleId
      ? db.query.role.findFirst({
          where: eq(schema.role.id, roleId),
        })
      : null,
  ])

  if (!server || !inviter) {
    console.error('Missing server or inviter data for invite email', {
      serverId,
      inviterId,
      server: !!server,
      inviter: !!inviter,
    })
    return
  }

  const inviterName = inviter.name || inviter.username || 'Someone'
  const serverName = server.name
  const roleName = role?.name

  const inviteUrl = `${ONE_SERVER_URL}/invite/${inviteId}`

  const roleText = roleName ? ` with the <b>${roleName}</b> role` : ''

  const htmlBody = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>You're invited to ${serverName}</h2>
      <p style="font-size: 16px; line-height: 1.5;">
        <b>${inviterName}</b> has invited you to join <b>${serverName}</b>${roleText}.
      </p>
      <p style="margin: 30px 0;">
        <a href="${inviteUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Accept Invitation
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        If you can't click the button, copy and paste this link into your browser:<br>
        <a href="${inviteUrl}" style="color: #007bff;">${inviteUrl}</a>
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `

  const subject = roleName
    ? `${inviterName} invited you to ${serverName} as ${roleName}`
    : `${inviterName} invited you to ${serverName}`

  return sendHtmlEmail({
    to: email,
    subject,
    htmlBody,
  })
}
