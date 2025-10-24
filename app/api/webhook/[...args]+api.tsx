import { assertString } from '@vxrn/helpers'
import type { Endpoint } from 'one'
import { APP_DATA_WEBHOOK_KEY } from '~/features/apps/constants'
import { runApp } from '~/features/apps/runApp'
import { zeroServer } from '~/zero/server'

export default (async (req) => {
  const { pathname } = new URL(req.url)
  const segments = pathname.split('/').filter(Boolean)

  console.info(`🪝 incoming webhook`, pathname)

  // expecting: /api/webhook/serverId/appInstallId/webhookId
  if (segments.length < 5) {
    return Response.json({ error: 'Invalid webhook URL' }, { status: 400 })
  }

  const serverId = assertString(segments[2], 'serverId')
  const appInstallId = assertString(segments[3], 'appInstallId')
  const webhookId = segments[4] || 'default'

  try {
    // get the webhook context stored when registering
    const contextKey = webhookId
      ? `${APP_DATA_WEBHOOK_KEY}-${webhookId}`
      : APP_DATA_WEBHOOK_KEY
    const contextData = await zeroServer.query(async (q) =>
      q.data
        .one()
        .where('appInstallId', appInstallId)
        .where('key', contextKey)
        .where('permissions', 'private')
    )

    if (!contextData) {
      console.error(`[webhook] no context data at key ${contextKey} for ${appInstallId}`)
      return Response.json({ error: 'Webhook not found' }, { status: 404 })
    }

    const context = JSON.parse(contextData.value)

    // get the appId from appInstall
    const appInstall = await zeroServer.query(async (q) =>
      q.appInstall.where('id', appInstallId).one()
    )

    if (!appInstall?.appId) {
      console.error(`[webhook] no app found for appInstall ${appInstallId}`)
      return Response.json({ error: 'App not found' }, { status: 404 })
    }

    // get the webhook payload and headers
    const body = await req.json()
    const headers: Record<string, string> = {}

    // extract relevant headers
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value
    })

    const payload = {
      ...body,
      headers,
    }

    // run the app's onWebhook handler
    await runApp({
      userId: contextData.creatorId,
      appId: appInstall.appId,
      serverId,
      insertResponseAsMessage: Boolean(context.channelId),
      webhook: {
        webhookId,
        context,
        payload,
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return Response.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}) satisfies Endpoint
