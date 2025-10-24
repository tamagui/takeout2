import type { Endpoint } from 'one'
import { unfurlUrl } from '~/features/unfurl/unfurl'

export const GET: Endpoint = async (request) => {
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'URL parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    new URL(targetUrl)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid URL provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const data = await unfurlUrl(targetUrl)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('Unfurl error:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to unfurl URL',
        url: targetUrl,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
