// import { getHeaders } from './getHeaders'
// import { streamToString } from './streamToString'

export async function prettyPrintRequest(request: Request): Promise<void> {
  // one bug potentially, clone casues: Unhandled rejection at [object Promise] TypeError: unusable
  // const request = requestIn.clone()

  // const requestDetails = {
  //   method: request.method,
  //   url: request.url,
  //   headers: getHeaders(requestIn.headers),
  //   body: request.body ? await streamToString(request.body) : null,
  // }

  console.info(request)
}
