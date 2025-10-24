import * as postmark from 'postmark'
import { POSTMARK_SERVER_TOKEN } from '~/server/env-server'
import type { EmailTemplateAlias, SendEmailParams } from './types'

if (!POSTMARK_SERVER_TOKEN) {
  console.info(`No postmark token!`)
}

export async function sendEmail<T extends EmailTemplateAlias>(
  params: SendEmailParams<T>
) {
  const { to, template, variables, from = 'team@tamagui.dev' } = params

  if (process.env.NODE_ENV !== 'production') {
    console.info(`Not sending email to ${to} since we're not on prod.`, {
      template,
      variables,
    })
    return
  }

  if (!POSTMARK_SERVER_TOKEN) {
    console.info(`No postmark token! Not sending email`, params)
    return
  }

  const client = new postmark.ServerClient(POSTMARK_SERVER_TOKEN)

  return client.sendEmailWithTemplate({
    From: from,
    To: to,
    TemplateAlias: template,
    TemplateModel: variables,
  })
}
