// example upload endpoint - add auth before using in production:
// import { ensureAuth } from '~/features/auth/server/ensureAuth'
// await ensureAuth(req)

import { randomId } from '@take-out/helpers'

import { s3Client } from '~/features/upload/s3client'
import { defaultBucket, uploadToS3 } from '~/features/upload/upload'

const folder = 'uploads'

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const formData = (await req.formData()) as unknown as FormData // not sure why this regressed
  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return Response.json({ error: 'Failed to parse the form' }, { status: 500 })
  }

  // console.info(`[Upload API] File received: ${file.name}, type: ${file.type}, size: ${file.size}`)

  try {
    const key = `${folder}/${randomId()}-${file.name}`

    // for images, read into buffer first
    if (file.type.startsWith('image/')) {
      const arrayBuffer = await file.arrayBuffer()
      const imageBytes = new Uint8Array(arrayBuffer)

      const result = await uploadToS3(s3Client, {
        bucket: defaultBucket,
        key,
        body: imageBytes,
        contentType: file.type,
      })

      return Response.json({ message: 'File uploaded successfully', ...result })
    }

    // non-image files - upload directly
    const result = await uploadToS3(s3Client, {
      bucket: defaultBucket,
      key,
      body: file.stream(),
      contentType: file.type,
    })

    return Response.json({ message: 'File uploaded successfully', ...result })
  } catch (error) {
    return Response.json(
      { error: 'Failed to upload file', details: `${error}` },
      { status: 500 }
    )
  }
}
