import { ONE_SERVER_URL } from '~/server/env-server'
import { sendHtmlEmail } from '../sendHtmlEmail'

export async function sendMagicLinkEmail(email: string, args: { link: string }) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Magic Link</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Click the button below to sign in to your account. This link will expire in 10 minutes.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${args.link}" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Sign In
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If you didn't request this email, you can safely ignore it.
          </p>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #666; margin: 5px 0; word-break: break-all;">
              ${args.link}
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="font-size: 12px; color: #999;">
            Sent from <a href="${ONE_SERVER_URL}" style="color: #667eea; text-decoration: none;">Chat</a>
          </p>
        </div>
      </body>
    </html>
  `

  return sendHtmlEmail({
    to: email,
    subject: 'Your Magic Link',
    htmlBody: html,
  })
}
