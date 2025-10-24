import { assertString } from '@vxrn/helpers'
import type { Endpoint } from 'one'
import { ensureAuth } from '~/auth/server/ensureAuth'
import { runApp } from '~/features/apps/runApp'
import { zeroServer } from '~/zero/server'

export const POST: Endpoint = async (req) => {
  const { user } = await ensureAuth(req)
  const { searchParams } = new URL(req.url)

  const appInstallId = assertString(searchParams.get('appInstallId'), 'appInstallId')
  // TODO validate this
  const serverId = assertString(searchParams.get('serverId'), 'serverId')

  // Get the appId from appInstall
  const appInstall = await zeroServer.query(
    async (q) => await q.appInstall.where('id', appInstallId).one()
  )

  if (!appInstall?.appId) {
    return Response.json(
      { error: true, message: 'App install not found' },
      { status: 404 }
    )
  }

  try {
    const result = await runApp({
      userId: user.id,
      appId: appInstall.appId,
      serverId,
      action: {
        name: 'sync',
        channelId: serverId,
        message: '',
      },
    })

    return Response.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Error executing app:', error)
    return Response.json(
      {
        error: true,
        message: `Error executing app: ${(error as any).message}`,
      },
      {
        status: 500,
      }
    )
  }
}
