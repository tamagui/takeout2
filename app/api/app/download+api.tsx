import type { Endpoint } from 'one'

export const GET: Endpoint = async (req) => {
  const url = new URL(req.url)
  const [_api, _app, _download, uid, version] = url.pathname.split('/')
  console.info(`downloading app ${uid} ${version}`)
  return new Response()
}
