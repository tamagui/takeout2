import type { Endpoint } from 'one'
import { CLOUDFLARE_R2_PUBLIC_URL } from '~/server/env-server'

export const GET: Endpoint = async (request) => {
  const target = request.headers.get('tauri-target') || 'darwin'
  const arch = request.headers.get('tauri-arch') || 'aarch64'
  const currentVersion = request.headers.get('tauri-current-version') || '0.0.0'

  console.info(`[tauri-update] check ${target} ${arch} ${currentVersion}`)

  if (target !== 'darwin' || arch !== 'aarch64') {
    console.error(`[tauri-update] no target`, target)
    return Response.json(
      {
        error: 'Unsupported platform',
        supported: false,
        platform: `${target}-${arch}`,
      },
      { status: 404 }
    )
  }

  try {
    const manifestUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/onechatimages/releases/tauri-update.json`
    const manifestResponse = await fetch(manifestUrl)

    if (!manifestResponse.ok) {
      console.error(`[tauri-update] !manifestResponse.ok`)
      return Response.json(
        {
          error: 'No updates available',
          status: 'not_found',
        },
        { status: 404 }
      )
    }

    const manifest = await manifestResponse.json()

    // Check if update is needed
    if (currentVersion && manifest.version === currentVersion) {
      return Response.json(
        {
          status: 'up_to_date',
          version: currentVersion,
        },
        { status: 204 }
      )
    }

    const platform = `${target}-${arch}`
    const platformData = manifest.platforms?.[platform]

    if (!platformData) {
      console.error(
        `[tauri-update] no update for platform ${platform} in ${JSON.stringify(manifest.platforms || {})}`
      )
      return Response.json(
        {
          error: 'No update for platform',
          platform,
        },
        { status: 404 }
      )
    }

    return Response.json({
      ...manifest,
      url: platformData.url,
      signature: platformData.signature,
    })
  } catch (error) {
    console.error('[tauri-update] Error checking for updates:', error)
    return Response.json(
      {
        error: 'Failed to check for updates',
      },
      { status: 500 }
    )
  }
}
