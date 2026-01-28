// example upload endpoint - add auth before using in production:
// import { ensureAuth } from '~/features/auth/server/ensureAuth'
// await ensureAuth(req)

import { randomId } from '@take-out/helpers'

import { moderateImage } from '~/features/upload/moderateImage'
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
    // moderate images before upload
    if (file.type.startsWith('image/')) {
      const arrayBuffer = await file.arrayBuffer()
      const imageBytes = new Uint8Array(arrayBuffer)

      const moderation = await moderateImage(imageBytes)
      if (!moderation.safe) {
        const reasons = moderation.blockedLabels.map((l) => l.Name).join(', ')
        console.info(`[Upload API] Image blocked by moderation: ${reasons}`)
        return Response.json(
          {
            error: 'Image violates content policy',
            code: 'CONTENT_POLICY_VIOLATION',
          },
          { status: 400 }
        )
      }

      // upload from buffer since we already read the file
      const key = `${folder}/${randomId()}-${file.name}`
      const result = await uploadToS3(s3Client, {
        bucket: defaultBucket,
        key,
        body: imageBytes,
        contentType: file.type,
      })

      return Response.json({ message: 'File uploaded successfully', ...result })
    }

    // non-image files - upload directly
    const key = `${folder}/${randomId()}-${file.name}`
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
