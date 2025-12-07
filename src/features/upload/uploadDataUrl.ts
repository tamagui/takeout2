import { randomId } from '@take-out/helpers'

import { s3Client } from './s3client'
import { uploadToS3, defaultBucket } from './upload'

const folder = 'avatars'

export async function uploadDataUrlToR2(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith('data:')) {
    return dataUrl
  }

  const matches = dataUrl.match(/^data:(.+?);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid data URL format')
  }

  const [, mimeType, base64Data] = matches

  const buffer = Buffer.from(base64Data!, 'base64')

  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/jpeg' ? 'jpg' : 'png'
  const key = `${folder}/${randomId()}.${ext}`

  const result = await uploadToS3(s3Client, {
    bucket: defaultBucket,
    key,
    body: buffer,
    contentType: mimeType,
  })

  return result.url
}
