import http2 from 'node:http2'
import { APNS_ENDPOINT } from '~/server/env-server'
import { getApnsToken } from './getApnsToken'

type Payload = {
  aps: {
    alert:
      | {
          title: string
          body: string
        }
      | string
    sound?: string
    badge?: number
    [key: string]: any // For any custom data
  }
  [key: string]: any // For any custom data outside aps
}

export async function sendApnsNotification(
  /** In general, the topic is the app's bundle ID/app ID. */
  topic: string,
  deviceToken: string,
  payload: Payload,
  options: Record<string, any> = {}
) {
  if (!APNS_ENDPOINT) {
    throw new Error('Missing APNS_ENDPOINT environment variable.')
  }

  const url = new URL(APNS_ENDPOINT)
  const apnsToken = await getApnsToken()

  const isBackground = payload?.aps?.['content-available'] === 1
  const pushType = isBackground ? 'background' : 'alert'
  const priority = isBackground ? '5' : '10'

  const client = http2.connect(url.origin)
  const cleanToken = deviceToken.replace(/[<>\s]/g, '')

  const headers: http2.OutgoingHttpHeaders = {
    ':method': 'POST',
    ':scheme': 'https',
    ':authority': url.host,
    ':path': `/3/device/${cleanToken}`,
    authorization: `bearer ${apnsToken}`,
    'apns-topic': topic,
    'apns-push-type': pushType,
    'apns-priority': priority,
    ...options,
  }

  const body = JSON.stringify(payload)
  const req = client.request(headers)

  return new Promise<{ ok: boolean; status: number; text: string }>((resolve, reject) => {
    let data = ''
    let status = 0

    req.setEncoding('utf8')

    req.on('response', (resHeaders) => {
      status = Number(resHeaders[':status'] || 0)
    })

    req.on('data', (chunk) => {
      data += chunk
    })

    req.on('end', () => {
      client.close()
      resolve({
        ok: status >= 200 && status < 300,
        status,
        text: data,
      })
    })

    req.on('error', (err) => {
      client.close()
      reject(err)
    })

    req.end(body)
  })
}
