import { Upload } from '@aws-sdk/lib-storage'

import { CLOUDFLARE_R2_PUBLIC_URL } from '~/server/env-server'

import type { UploadParams, UploadResult } from './types'
import type { S3Client } from '@aws-sdk/client-s3'

export const defaultBucket = 'chat'

export async function uploadToS3(
  client: S3Client,
  {
    bucket = defaultBucket,
    key,
    body,
    contentType,
    isPublic = false,
  }: UploadParams & { isPublic?: boolean }
): Promise<UploadResult> {
  const uploadParams = {
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ...(isPublic && { ACL: 'public-read' as const }),
  }

  const uploader = new Upload({
    client,
    params: uploadParams,
  })

  await uploader.done()

  return {
    key: uploadParams.Key,
    url: `${CLOUDFLARE_R2_PUBLIC_URL}/${bucket}/${key}`,
  }
}
