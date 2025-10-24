import * as postmark from 'postmark'
import { POSTMARK_SERVER_TOKEN } from '~/server/env-server'

if (!POSTMARK_SERVER_TOKEN) {
  console.info(`No postmark token!`)
}

export async function sendHtmlEmail({
  to,
  subject,
  htmlBody,
  textBody,
  from = 'team@tamagui.dev',
}: {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
  from?: string
}) {
  if (process.env.NODE_ENV !== 'production') {
    console.info(
      `Not sending email to ${to} since we're not on prod. Here's the email:\n`,
      `subject: ${subject}\n`,
      `to: ${to}\n`,
      `from: ${from}\n`,
      `body: ${htmlBody || textBody}\n`
    )
    return
  }

  if (!POSTMARK_SERVER_TOKEN) {
    console.info(`No postmark token! Not sending email`, { to, subject })
    return
  }

  const client = new postmark.ServerClient(POSTMARK_SERVER_TOKEN)

  return client.sendEmail({
    From: from,
    To: to,
    Subject: subject,
    HtmlBody: htmlBody,
    TextBody: textBody || htmlBody.replace(/<[^>]*>/g, ''),
  })
}
