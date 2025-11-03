import { getHeaders } from './getHeaders'
import { streamToString } from './streamToString'

export async function prettyPrintResponse(responseIn: Response): Promise<void> {
  const response = responseIn.clone()

  const responseDetails = {
    status: response.status,
    statusText: response.statusText,
    headers: getHeaders(responseIn.headers),
    body: response.body ? await streamToString(response.body) : null,
  }

  console.info(responseDetails)
}
