import { ONE_SERVER_URL } from '~/server/env-server'
import { sendHtmlEmail } from '../sendHtmlEmail'

export async function sendPrivateBetaInvite({ email }: { email: string }) {
  const inviteUrl = `${ONE_SERVER_URL}/_/login`

  const htmlBody = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Welcome to Start Private Beta</h2>
      <p style="font-size: 16px; line-height: 1.5;">
        You've been invited to join the <b>Start</b> private beta!
      </p>
      <p style="margin: 30px 0;">
        <a href="${inviteUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Get Started
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        If you can't click the button, copy and paste this link into your browser:<br>
        <a href="${inviteUrl}" style="color: #007bff;">${inviteUrl}</a>
      </p>
    </div>
  `

  return sendHtmlEmail({
    to: email,
    subject: 'Welcome to Start Private Beta',
    htmlBody,
  })
}
