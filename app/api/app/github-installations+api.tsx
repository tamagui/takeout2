import { getDb } from '~/database'
import { data as dataTable } from '~/database/schema-public'
import { and, eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { CHAT_GITHUB_APP_ID, CHAT_GITHUB_APP_PRIVATE_KEY } from '~/server/env-server'
import { ensureAuth } from '~/auth/server/ensureAuth'

export async function GET(req: Request): Promise<Response> {
  await ensureAuth(req)

  const { searchParams } = new URL(req.url)
  const appInstallId = searchParams.get('appInstallId')
  const serverId = searchParams.get('serverId')

  if (!appInstallId || !serverId) {
    return Response.json({ error: 'Missing parameters' }, { status: 400 })
  }

  try {
    const oauthData = await getDb()
      .select()
      .from(dataTable)
      .where(
        and(
          eq(dataTable.serverId, serverId),
          eq(dataTable.appInstallId, appInstallId),
          eq(dataTable.key, 'oauth-token')
        )
      )
      .limit(1)

    if (!oauthData.length) {
      return Response.json({ error: 'OAuth not connected' })
    }

    const oauthToken = oauthData[0]?.value
    if (!oauthToken) {
      return Response.json({ error: 'No OAuth token found' })
    }

    // Try to get installations using OAuth token
    const response = await fetch('https://api.github.com/user/installations', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${oauthToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    if (!response.ok) {
      // If OAuth fails, try with GitHub App JWT
      if (CHAT_GITHUB_APP_ID && CHAT_GITHUB_APP_PRIVATE_KEY) {
        const now = Math.floor(Date.now() / 1000)
        const payload = {
          iat: now - 60,
          exp: now + 600,
          iss: CHAT_GITHUB_APP_ID,
        }

        const appJwt = jwt.sign(payload, CHAT_GITHUB_APP_PRIVATE_KEY, {
          algorithm: 'RS256',
        })

        const appResponse = await fetch('https://api.github.com/app/installations', {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${appJwt}`,
            'X-GitHub-Api-Version': '2022-11-28',
          },
        })

        if (appResponse.ok) {
          const installations = await appResponse.json()
          return Response.json({ installations })
        }
      }

      return Response.json({ error: 'Failed to fetch installations' })
    }

    const responseData = await response.json()
    return Response.json({ installations: responseData.installations || [] })
  } catch (error: any) {
    console.error('Error fetching GitHub installations:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
